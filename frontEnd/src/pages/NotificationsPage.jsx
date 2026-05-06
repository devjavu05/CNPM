import { useEffect, useState } from "react";
import StatusMessage from "../components/StatusMessage";
import useStatus from "../hooks/useStatus";
import { libraryApi } from "../lib/api";

function formatDateTime(value) {
  if (!value) return "Chưa xác định";
  return new Date(value).toLocaleString("vi-VN");
}

function badgeLabel(type) {
  switch (type) {
    case "OVERDUE":
      return "Quá hạn";
    case "FINE":
      return "Phạt";
    case "RESERVATION_READY":
      return "Có sách";
    default:
      return "Nhắc nhở";
  }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [selected, setSelected] = useState(null);
  const status = useStatus();

  async function loadNotifications(selectedId) {
    try {
      const list = await libraryApi.getNotifications();
      setNotifications(list);
      if (selectedId) {
        const matched = list.find((item) => item.id === selectedId);
        if (matched) {
          setSelected(matched);
        }
      } else if (!selected && list.length) {
        setSelected(list[0]);
      }
      window.dispatchEvent(new CustomEvent("notifications:updated"));
    } catch (error) {
      status.setError(error.message);
    }
  }

  useEffect(() => {
    status.clearStatus();
    loadNotifications();
  }, []);

  async function handleOpenNotification(notificationId) {
    status.clearStatus();
    try {
      const detail = await libraryApi.getNotificationDetail(notificationId);
      setSelected(detail);
      setNotifications((current) =>
        current.map((item) => (item.id === notificationId ? { ...item, ...detail, read: true } : item))
      );
      window.dispatchEvent(new CustomEvent("notifications:updated"));
    } catch (error) {
      status.setError(error.message);
    }
  }

  async function handleMarkAllAsRead() {
    status.clearStatus();
    try {
      await libraryApi.markAllNotificationsRead();
      setNotifications((current) => current.map((item) => ({ ...item, read: true })));
      if (selected) {
        setSelected((current) => (current ? { ...current, read: true } : current));
      }
      status.setSuccess("Đã đánh dấu tất cả thông báo là đã đọc.");
      window.dispatchEvent(new CustomEvent("notifications:updated"));
    } catch (error) {
      status.setError(error.message);
    }
  }

  return (
    <div className="page-container">
      <section className="page-hero">
        <div>
          <span className="eyebrow">Thông báo thư viện</span>
          <h1>Thông báo của bạn</h1>
          <p className="muted">
            Theo dõi nhắc hạn trả, khoản phạt chưa xử lý và thông tin khi sách đặt trước đã sẵn sàng.
          </p>
        </div>
        <div className="topbar-actions">
          <button className="ghost-button" type="button" onClick={handleMarkAllAsRead} disabled={!notifications.some((item) => !item.read)}>
            Đánh dấu tất cả là đã đọc
          </button>
        </div>
      </section>

      <StatusMessage status={status.status} />

      {!notifications.length ? (
        <section className="panel">
          <div className="empty">Bạn chưa có thông báo nào.</div>
        </section>
      ) : (
        <section className="notifications-layout">
          <aside className="panel notification-list-panel">
            <div className="notification-list">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  className={`notification-item${selected?.id === notification.id ? " active" : ""}${notification.read ? "" : " unread"}`}
                  onClick={() => handleOpenNotification(notification.id)}
                >
                  <div className="notification-item-top">
                    <strong>{notification.title}</strong>
                    {!notification.read ? <span className="unread-dot" /> : null}
                  </div>
                  <div className="chip-row">
                    <span className={`chip ${notification.read ? "subtle" : "warn"}`}>{badgeLabel(notification.type)}</span>
                    <span className="muted">{formatDateTime(notification.createdAt)}</span>
                  </div>
                </button>
              ))}
            </div>
          </aside>

          <article className="panel notification-detail-panel">
            {selected ? (
              <>
                <div className="panel-header">
                  <div>
                    <span className="eyebrow">Chi tiết</span>
                    <h2>{selected.title}</h2>
                    <p className="muted">{formatDateTime(selected.createdAt)}</p>
                  </div>
                  <span className={`chip ${selected.read ? "subtle" : "warn"}`}>{selected.read ? "Đã đọc" : "Chưa đọc"}</span>
                </div>
                <div className="notification-content">{selected.content}</div>
              </>
            ) : (
              <div className="empty">Chọn một thông báo để xem nội dung chi tiết.</div>
            )}
          </article>
        </section>
      )}
    </div>
  );
}
