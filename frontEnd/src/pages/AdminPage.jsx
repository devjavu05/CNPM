import { useEffect, useState } from "react";
import ProtectedPage from "../components/ProtectedPage";
import PageHero from "../components/PageHero";
import DataTable from "../components/DataTable";
import StatusMessage from "../components/StatusMessage";
import useStatus from "../hooks/useStatus";
import { libraryApi } from "../lib/api";

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [updateUser, setUpdateUser] = useState({ fullname: "", dob: "", password: "", roles: [] });
  const [createRole, setCreateRole] = useState({ name: "", description: "", permissions: [] });
  const [createPermission, setCreatePermission] = useState({ name: "", description: "" });
  const userStatus = useStatus();
  const roleStatus = useStatus();
  const permissionStatus = useStatus();

  useEffect(() => {
    Promise.all([loadUsers(), loadRoles(), loadPermissions()]).catch(() => {});
  }, []);

  async function loadUsers() {
    const result = await libraryApi.getUsers();
    setUsers(result);
    setSelectedUser((current) => result.find((item) => item.username === current?.username) || result[0] || null);
  }

  async function loadRoles() {
    const result = await libraryApi.getRoles();
    setRoles(result);
  }

  async function loadPermissions() {
    const result = await libraryApi.getPermissions();
    setPermissions(result);
  }

  useEffect(() => {
    if (!selectedUser) return;
    setUpdateUser({
      fullname: selectedUser.fullname || "",
      dob: selectedUser.dob || "",
      password: "",
      roles: (selectedUser.roles || []).map((role) => role.name)
    });
  }, [selectedUser]);

  async function handleUpdateUser(event) {
    event.preventDefault();
    if (!selectedUser) return;
    userStatus.clearStatus();
    try {
      await libraryApi.updateUser(selectedUser.username, updateUser);
      userStatus.setSuccess("Đã cập nhật tài khoản.");
      await loadUsers();
    } catch (error) {
      userStatus.setError(error.message);
    }
  }

  async function handleCreateRole(event) {
    event.preventDefault();
    roleStatus.clearStatus();
    try {
      await libraryApi.createRole(createRole);
      roleStatus.setSuccess("Đã tạo vai trò.");
      setCreateRole({ name: "", description: "", permissions: [] });
      await loadRoles();
    } catch (error) {
      roleStatus.setError(error.message);
    }
  }

  async function handleCreatePermission(event) {
    event.preventDefault();
    permissionStatus.clearStatus();
    try {
      await libraryApi.createPermission(createPermission);
      permissionStatus.setSuccess("Đã tạo quyền.");
      setCreatePermission({ name: "", description: "" });
      await loadPermissions();
    } catch (error) {
      permissionStatus.setError(error.message);
    }
  }

  return (
    <ProtectedPage role="CHU_THU_VIEN">
      <PageHero
        eyebrow="Chủ thư viện"
        title="Điều hành tài khoản, vai trò và quyền"
        description="Phân hệ này dành cho Chủ thư viện để quản lý cấu hình truy cập và tài khoản hệ thống."
      />

      <section className="grid two split-sections">
        <section className="panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Tài khoản</span>
              <h3>Quản lí người dùng</h3>
            </div>
          </div>
          <StatusMessage status={userStatus.status} />
          <div className="selector-list compact">
            {users.map((user) => (
              <button key={user.username} type="button" className={`selector-card${selectedUser?.username === user.username ? " active" : ""}`} onClick={() => setSelectedUser(user)}>
                <strong>{user.fullname || user.username}</strong>
                <span>{user.username}</span>
              </button>
            ))}
          </div>
          <form className="form-grid" onSubmit={handleUpdateUser}>
            <div className="field full">
              <label>Tài khoản đang chọn</label>
              <input readOnly value={selectedUser ? `${selectedUser.username} (${selectedUser.fullname || "Chưa có họ tên"})` : ""} />
            </div>
            <div className="field"><label>Họ và tên</label><input value={updateUser.fullname} onChange={(event) => setUpdateUser({ ...updateUser, fullname: event.target.value })} required /></div>
            <div className="field"><label>Ngày sinh</label><input type="date" value={updateUser.dob} onChange={(event) => setUpdateUser({ ...updateUser, dob: event.target.value })} required /></div>
            <div className="field full"><label>Mật khẩu mới</label><input type="password" value={updateUser.password} onChange={(event) => setUpdateUser({ ...updateUser, password: event.target.value })} required /></div>
            <div className="field full">
              <label>Vai trò</label>
              <div className="check-grid">
                {roles.map((role) => (
                  <label className="check-item" key={role.name}>
                    <input
                      type="checkbox"
                      checked={updateUser.roles.includes(role.name)}
                      onChange={(event) =>
                        setUpdateUser({
                          ...updateUser,
                          roles: event.target.checked
                            ? [...updateUser.roles, role.name]
                            : updateUser.roles.filter((item) => item !== role.name)
                        })
                      }
                    />
                    <span>{role.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="form-actions"><button className="button" type="submit">Lưu tài khoản</button></div>
          </form>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Thiết kế truy cập</span>
              <h3>Vai trò và quyền</h3>
            </div>
          </div>
          <StatusMessage status={roleStatus.status} />
          <form className="form-grid" onSubmit={handleCreateRole}>
            <div className="field"><label>Tên vai trò</label><input value={createRole.name} onChange={(event) => setCreateRole({ ...createRole, name: event.target.value })} required /></div>
            <div className="field"><label>Mô tả</label><input value={createRole.description} onChange={(event) => setCreateRole({ ...createRole, description: event.target.value })} required /></div>
            <div className="field full">
              <label>Danh sách quyền</label>
              <div className="check-grid">
                {permissions.map((permission) => (
                  <label className="check-item" key={permission.name}>
                    <input
                      type="checkbox"
                      checked={createRole.permissions.includes(permission.name)}
                      onChange={(event) =>
                        setCreateRole({
                          ...createRole,
                          permissions: event.target.checked
                            ? [...createRole.permissions, permission.name]
                            : createRole.permissions.filter((item) => item !== permission.name)
                        })
                      }
                    />
                    <span>{permission.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="form-actions"><button className="button" type="submit">Tạo vai trò</button></div>
          </form>

          <StatusMessage status={permissionStatus.status} />
          <form className="form-grid" onSubmit={handleCreatePermission}>
            <div className="field"><label>Tên quyền</label><input value={createPermission.name} onChange={(event) => setCreatePermission({ ...createPermission, name: event.target.value })} required /></div>
            <div className="field"><label>Mô tả</label><input value={createPermission.description} onChange={(event) => setCreatePermission({ ...createPermission, description: event.target.value })} required /></div>
            <div className="form-actions"><button className="button secondary" type="submit">Tạo quyền</button></div>
          </form>
        </section>
      </section>

      <section className="grid two split-sections">
        <section className="panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Vai trò</span>
              <h3>Danh sách hiện có</h3>
            </div>
          </div>
          <DataTable
            rows={roles}
            columns={[
              { label: "Vai trò", render: (item) => item.name },
              { label: "Mô tả", render: (item) => item.description || "-" },
              { label: "Quyền", render: (item) => (item.permissions || []).map((permission) => permission.name).join(", ") }
            ]}
          />
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Quyền</span>
              <h3>Danh sách hiện có</h3>
            </div>
          </div>
          <DataTable
            rows={permissions}
            columns={[
              { label: "Quyền", render: (item) => item.name },
              { label: "Mô tả", render: (item) => item.description || "-" }
            ]}
          />
        </section>
      </section>
    </ProtectedPage>
  );
}
