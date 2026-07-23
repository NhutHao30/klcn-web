import React, { useState, useEffect } from 'react';
import AdminLayout from '../../Layout/AdminLayout';
import axiosClient from '../../services/axiosClient';
import '../../css/admin.css';

const AdminTransferPage = () => {
  const [activeTab, setActiveTab] = useState('requests'); // requests | transfers
  const [requests, setRequests] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [storeEmployees, setStoreEmployees] = useState([]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRequest, setNewRequest] = useState({ GHICHU: '', details: [{ MASP: '', SOLUONG: 1 }] });

  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [acceptData, setAcceptData] = useState({ reqId: null, HINHTHUC_VANCHUYEN: 'Tự vận chuyển', MA_VANDON: '', NGUOI_VANCHUYEN: '', PHI_VANCHUYEN: 0, GHICHU: '' });

  const [showCoordModal, setShowCoordModal] = useState(false);
  const [coordData, setCoordData] = useState({ reqId: null, MACUAHANG_XUAT: '', HINHTHUC_VANCHUYEN: 'Tự vận chuyển', MA_VANDON: '', NGUOI_VANCHUYEN: '', PHI_VANCHUYEN: 0, GHICHU: '' });

  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [receiveData, setReceiveData] = useState({ transferId: null, details: [] });

  const fetchEmployees = async (storeId) => {
    try {
      const res = await axiosClient.get(`/admin/transfers/employees?store_id=${storeId || ''}`);
      setStoreEmployees(res.data);
    } catch(e) {}
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      const userRes = await axiosClient.get('/me');
      setCurrentUser(userRes.data);

      const prodRes = await axiosClient.get('/products');
      // Trích xuất mảng data vì backend dùng paginate()
      setProducts(prodRes.data.data ? prodRes.data.data : prodRes.data);

      if (userRes.data.MAROLE === 0) {
        const storeRes = await axiosClient.get('/admin/stores');
        setStores(storeRes.data);
      }

      if (activeTab === 'requests') {
        const res = await axiosClient.get('/admin/transfers/requests');
        setRequests(res.data);
      } else {
        const res = await axiosClient.get('/admin/transfers');
        setTransfers(res.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    try {
      await axiosClient.post('/admin/transfers/requests', newRequest);
      alert('Tạo yêu cầu thành công!');
      setShowCreateModal(false);
      setNewRequest({ GHICHU: '', details: [{ MASP: '', SOLUONG: 1 }] });
      fetchData();
    } catch (error) {
      alert('Lỗi: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleAcceptRequest = async (e) => {
    e.preventDefault();
    try {
      await axiosClient.post(`/admin/transfers/requests/${acceptData.reqId}/accept`, acceptData);
      alert('Tiếp nhận thành công!');
      setShowAcceptModal(false);
      fetchData();
    } catch (error) {
      alert('Lỗi: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleCoordinateRequest = async (e) => {
    e.preventDefault();
    try {
      await axiosClient.post(`/admin/transfers/requests/${coordData.reqId}/coordinate`, coordData);
      alert('Điều phối thành công!');
      setShowCoordModal(false);
      fetchData();
    } catch (error) {
      alert('Lỗi: ' + (error.response?.data?.error || error.message));
    }
  };

  const updateTransferStatus = async (id, status, extra = null) => {
    if (!window.confirm(`Xác nhận chuyển trạng thái thành: ${status}?`)) return;
    try {
      let payload = { TRANGTHAI: status };
      if (extra) payload = { ...payload, ...extra };
      await axiosClient.put(`/admin/transfers/${id}/status`, payload);
      alert('Cập nhật thành công!');
      fetchData();
    } catch (error) {
      alert('Lỗi: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleOpenAcceptModal = (reqId) => {
    setAcceptData({ reqId, HINHTHUC_VANCHUYEN: 'Tự vận chuyển', MA_VANDON: '', NGUOI_VANCHUYEN: '', PHI_VANCHUYEN: 0, GHICHU: '' });
    fetchEmployees(currentUser?.nhanvien?.MACUAHANG);
    setShowAcceptModal(true);
  };

  const handleOpenCoordModal = (reqId) => {
    setCoordData({ reqId, MACUAHANG_XUAT: '', HINHTHUC_VANCHUYEN: 'Tự vận chuyển', MA_VANDON: '', NGUOI_VANCHUYEN: '', PHI_VANCHUYEN: 0, GHICHU: '' });
    setShowCoordModal(true);
  };

  const handleReceiveRequest = async (e) => {
    e.preventDefault();
    try {
      const invalid = receiveData.details.some(d => parseInt(d.SOLUONG_NHAN) < parseInt(d.SOLUONG_XUAT) && !d.LYDO_HAOHUT.trim());
      if (invalid) {
        alert('Vui lòng nhập "Lý do hao hụt" cho những sản phẩm nhận thiếu!');
        return;
      }
      await axiosClient.put(`/admin/transfers/${receiveData.transferId}/status`, {
        TRANGTHAI: 'Đã nhận hàng',
        details: receiveData.details.map(d => ({
          ID_CHITIET: d.ID_CHITIET, MASP: d.MASP, SOLUONG_NHAN: d.SOLUONG_NHAN, LYDO_HAOHUT: d.LYDO_HAOHUT
        }))
      });
      alert('Xác nhận nhận hàng thành công!');
      setShowReceiveModal(false);
      fetchData();
    } catch (error) {
      alert('Lỗi: ' + (error.response?.data?.error || error.message));
    }
  };

  return (
    <AdminLayout>
      <div className="container-fluid py-4">
        <h2>Quản lý Điều chuyển kho nội bộ</h2>

        <ul className="nav nav-tabs mb-4">
          <li className="nav-item">
            <button className={`nav-link ${activeTab === 'requests' ? 'active' : ''}`} onClick={() => setActiveTab('requests')}>
              Yêu Cầu Nhập Hàng
            </button>
          </li>
          <li className="nav-item">
            <button className={`nav-link ${activeTab === 'transfers' ? 'active' : ''}`} onClick={() => setActiveTab('transfers')}>
              Phiếu Điều Chuyển
            </button>
          </li>
        </ul>

        {activeTab === 'requests' && (
          <div>
            {currentUser?.MAROLE !== 0 && (
              <button className="btn btn-primary mb-3" onClick={() => setShowCreateModal(true)}>+ Tạo yêu cầu mới</button>
            )}
            
            <div className="table-responsive">
              <table className="table table-bordered table-hover fs-5">
                <thead className="table-dark">
                  <tr>
                    <th>Mã YC</th>
                    <th>Chi nhánh yêu cầu</th>
                    <th>Người tạo</th>
                    <th>Trạng thái</th>
                    <th>Chi tiết SP</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(req => (
                    <tr key={req.ID_YEUCAU}>
                      <td className="fw-bold text-primary">#{req.ID_YEUCAU}</td>
                      <td className="fw-bold">{req.TENCUAHANG}</td>
                      <td>{req.TEN_NGUOITAO || req.NGUOITAO}</td>
                      <td>
                        <span className={`badge bg-${req.TRANGTHAI === 'Chờ tiếp nhận' ? 'warning' : 'success'} fs-6`}>
                          {req.TRANGTHAI}
                        </span>
                      </td>
                      <td>
                        <ul className="mb-0">
                          {req.details.map(d => (
                            <li key={d.ID_CHITIET}>{d.TENSP} <span className="text-danger fw-bold">(x{d.SOLUONG_YEUCAU})</span></li>
                          ))}
                        </ul>
                      </td>
                      <td className="text-center">
                        {req.TRANGTHAI === 'Chờ tiếp nhận' && (
                          <>
                            {currentUser?.MAROLE === 0 ? (
                              <button className="btn btn-info fw-bold" onClick={() => handleOpenCoordModal(req.ID_YEUCAU)}>
                                Cấp quyền điều phối
                              </button>
                            ) : (
                              currentUser?.nhanvien?.MACUAHANG !== req.MACUAHANG_YEUCAU && (
                                <button className="btn btn-success fw-bold" onClick={() => handleOpenAcceptModal(req.ID_YEUCAU)}>
                                  Tiếp nhận xuất hàng
                                </button>
                              )
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'transfers' && (
          <div className="table-responsive">
            <table className="table table-bordered table-hover fs-5">
              <thead className="table-dark">
                <tr>
                  <th>Mã Phiếu</th>
                  <th>Kho Xuất</th>
                  <th>Kho Nhập</th>
                  <th>Trạng Thái</th>
                  <th>Vận Chuyển</th>
                  <th>Chi tiết</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map(t => (
                  <tr key={t.ID_PHIEU}>
                    <td className="fw-bold text-primary">#{t.ID_PHIEU}</td>
                    <td className="fw-bold text-danger">{t.TEN_CH_XUAT}</td>
                    <td className="fw-bold text-success">{t.TEN_CH_NHAP}</td>
                    <td>
                      <span className="badge bg-secondary fs-6">{t.TRANGTHAI}</span>
                    </td>
                    <td>
                      <strong className="text-info">{t.HINHTHUC_VANCHUYEN}</strong><br/>
                      <span className="text-muted">{t.MA_VANDON || t.NGUOI_VANCHUYEN}</span>
                    </td>
                    <td>
                      <ul className="mb-0">
                        {t.details.map(d => (
                          <li key={d.ID_CHITIET} className="mb-1">
                            {d.TENSP}: <br/>
                            <span className="text-danger fw-bold">Xuất {d.SOLUONG_XUAT}</span> | <span className={`fw-bold ${d.SOLUONG_NHAN < d.SOLUONG_XUAT ? 'text-warning' : 'text-success'}`}>Nhận {d.SOLUONG_NHAN !== null ? d.SOLUONG_NHAN : '?'}</span>
                            {d.LYDO_HAOHUT && <div className="text-muted" style={{fontSize: '0.85em', fontStyle: 'italic'}}>- Hao hụt: {d.LYDO_HAOHUT}</div>}
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="text-center">
                      {t.TRANGTHAI === 'Đang xử lý' && (currentUser?.MAROLE === 0 || currentUser?.nhanvien?.MACUAHANG == t.MACUAHANG_XUAT) && (
                        <button className="btn btn-warning fw-bold mb-2 w-100" onClick={() => updateTransferStatus(t.ID_PHIEU, 'Đang vận chuyển')}>
                          Giao cho Vận Chuyển
                        </button>
                      )}
                      {t.TRANGTHAI === 'Đang vận chuyển' && (currentUser?.MAROLE === 0 || currentUser?.nhanvien?.MACUAHANG == t.MACUAHANG_NHAP) && (
                        <button className="btn btn-success fw-bold w-100" onClick={() => {
                          const details = t.details.map(d => ({
                            ID_CHITIET: d.ID_CHITIET, TENSP: d.TENSP, MASP: d.MASP, SOLUONG_XUAT: d.SOLUONG_XUAT, SOLUONG_NHAN: d.SOLUONG_XUAT, LYDO_HAOHUT: ''
                          }));
                          setReceiveData({ transferId: t.ID_PHIEU, details });
                          setShowReceiveModal(true);
                        }}>
                          Xác nhận Nhận Hàng
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Modal Tạo Yêu Cầu */}
      {showCreateModal && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <form onSubmit={handleCreateRequest}>
                <div className="modal-header">
                  <h4 className="modal-title fw-bold text-primary">Tạo Yêu Cầu Nhập Hàng Mới</h4>
                  <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)}></button>
                </div>
                <div className="modal-body fs-5">
                  <div className="alert alert-info">
                    Chọn các sản phẩm chi nhánh đang thiếu để gửi yêu cầu cho các chi nhánh khác hỗ trợ.
                  </div>
                  {newRequest.details.map((d, index) => (
                    <div className="row mb-3 align-items-center" key={index}>
                      <div className="col-8">
                        <label className="form-label fw-bold">Sản phẩm cần nhập</label>
                        <select className="form-select form-select-lg" value={d.MASP} onChange={e => {
                          const newDetails = [...newRequest.details];
                          newDetails[index].MASP = e.target.value;
                          setNewRequest({ ...newRequest, details: newDetails });
                        }} required>
                          <option value="">-- Click để Chọn sản phẩm --</option>
                          {products.map(p => <option key={p.MASP} value={p.MASP}>{p.TENSP}</option>)}
                        </select>
                      </div>
                      <div className="col-3">
                        <label className="form-label fw-bold">Số lượng</label>
                        <input type="number" className="form-control form-control-lg" min="1" value={d.SOLUONG} onChange={e => {
                          const newDetails = [...newRequest.details];
                          newDetails[index].SOLUONG = e.target.value;
                          setNewRequest({ ...newRequest, details: newDetails });
                        }} required />
                      </div>
                      <div className="col-1 text-center" style={{ marginTop: '32px' }}>
                        {index > 0 && (
                          <button type="button" className="btn btn-danger btn-lg" onClick={() => {
                            const newDetails = newRequest.details.filter((_, i) => i !== index);
                            setNewRequest({ ...newRequest, details: newDetails });
                          }}><i className="fa-solid fa-trash"></i></button>
                        )}
                      </div>
                    </div>
                  ))}
                  <button type="button" className="btn btn-outline-primary fw-bold mb-4" onClick={() => {
                    setNewRequest({ ...newRequest, details: [...newRequest.details, { MASP: '', SOLUONG: 1 }] });
                  }}>+ Thêm một sản phẩm khác</button>

                  <div className="mb-3">
                    <label className="form-label fw-bold">Ghi chú (Tùy chọn)</label>
                    <textarea className="form-control form-control-lg" rows="3" placeholder="Nhập ghi chú cho các quản lý khác..." value={newRequest.GHICHU} onChange={e => setNewRequest({...newRequest, GHICHU: e.target.value})}></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary btn-lg" onClick={() => setShowCreateModal(false)}>Hủy</button>
                  <button type="submit" className="btn btn-primary btn-lg fw-bold"><i className="fa-solid fa-paper-plane"></i> Gửi Yêu Cầu</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tiếp nhận */}
      {showAcceptModal && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <form onSubmit={handleAcceptRequest}>
                <div className="modal-header">
                  <h5 className="modal-title">Tiếp nhận Yêu Cầu & Tạo Phiếu Xuất</h5>
                  <button type="button" className="btn-close" onClick={() => setShowAcceptModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Hình thức vận chuyển</label>
                    <select className="form-select" value={acceptData.HINHTHUC_VANCHUYEN} onChange={e => setAcceptData({...acceptData, HINHTHUC_VANCHUYEN: e.target.value, MA_VANDON: '', NGUOI_VANCHUYEN: ''})}>
                      <option value="Tự vận chuyển">Tự vận chuyển (NV giao)</option>
                      <option value="Giao Hàng Nhanh (GHN)">Giao Hàng Nhanh (GHN)</option>
                    </select>
                  </div>
                  {acceptData.HINHTHUC_VANCHUYEN === 'Giao Hàng Nhanh (GHN)' ? (
                    <div className="mb-3">
                      <label className="form-label">Mã vận đơn GHN</label>
                      <input type="text" className="form-control bg-light text-primary fw-bold" value="Hệ thống sẽ tự động tạo đơn giao hàng và lấy mã vận đơn." disabled />
                    </div>
                  ) : (
                    <div className="mb-3">
                      <label className="form-label">Chọn nhân viên đi giao hàng</label>
                      <select className="form-select" value={acceptData.NGUOI_VANCHUYEN} onChange={e => setAcceptData({...acceptData, NGUOI_VANCHUYEN: e.target.value})}>
                        <option value="">-- Chọn nhân viên cửa hàng --</option>
                        {storeEmployees.map(emp => <option key={emp.USERNAME} value={emp.HOTEN}>{emp.HOTEN} - {emp.USERNAME}</option>)}
                      </select>
                    </div>
                  )}
                  <div className="mb-3">
                    <label className="form-label">Phí vận chuyển dự kiến (nếu có)</label>
                    <input type="number" className="form-control" value={acceptData.PHI_VANCHUYEN} onChange={e => setAcceptData({...acceptData, PHI_VANCHUYEN: e.target.value})} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Ghi chú thêm</label>
                    <textarea className="form-control" value={acceptData.GHICHU} onChange={e => setAcceptData({...acceptData, GHICHU: e.target.value})}></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAcceptModal(false)}>Hủy</button>
                  <button type="submit" className="btn btn-primary">Xác Nhận & Tạo Phiếu</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Điều phối (Admin) */}
      {showCoordModal && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <form onSubmit={handleCoordinateRequest}>
                <div className="modal-header">
                  <h5 className="modal-title">Admin - Điều phối chi nhánh xuất hàng</h5>
                  <button type="button" className="btn-close" onClick={() => setShowCoordModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Chọn chi nhánh xuất hàng (Lấy hàng từ đâu?)</label>
                    <select className="form-select" value={coordData.MACUAHANG_XUAT} onChange={e => {
                      setCoordData({...coordData, MACUAHANG_XUAT: e.target.value});
                      fetchEmployees(e.target.value);
                    }} required>
                      <option value="">-- Chọn chi nhánh --</option>
                      {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Hình thức vận chuyển</label>
                    <select className="form-select" value={coordData.HINHTHUC_VANCHUYEN} onChange={e => setCoordData({...coordData, HINHTHUC_VANCHUYEN: e.target.value, MA_VANDON: '', NGUOI_VANCHUYEN: ''})}>
                      <option value="Tự vận chuyển">Tự vận chuyển (NV giao)</option>
                      <option value="Giao Hàng Nhanh (GHN)">Giao Hàng Nhanh (GHN)</option>
                    </select>
                  </div>
                  {coordData.HINHTHUC_VANCHUYEN === 'Giao Hàng Nhanh (GHN)' ? (
                    <div className="mb-3">
                      <label className="form-label">Mã vận đơn GHN</label>
                      <input type="text" className="form-control bg-light text-primary fw-bold" value="Hệ thống sẽ tự động tạo đơn giao hàng và lấy mã vận đơn." disabled />
                    </div>
                  ) : (
                    <div className="mb-3">
                      <label className="form-label">Chọn nhân viên đi giao hàng</label>
                      <select className="form-select" value={coordData.NGUOI_VANCHUYEN} onChange={e => setCoordData({...coordData, NGUOI_VANCHUYEN: e.target.value})}>
                        <option value="">-- Chọn nhân viên cửa hàng --</option>
                        {storeEmployees.map(emp => <option key={emp.USERNAME} value={emp.HOTEN}>{emp.HOTEN} - {emp.USERNAME}</option>)}
                      </select>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowCoordModal(false)}>Hủy</button>
                  <button type="submit" className="btn btn-primary">Xác Nhận & Tạo Phiếu</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xác nhận Nhận Hàng (Kiểm đếm) */}
      {showReceiveModal && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <form onSubmit={handleReceiveRequest}>
                <div className="modal-header">
                  <h4 className="modal-title fw-bold text-success">Kiểm Đếm & Nhận Hàng (Phiếu #{receiveData.transferId})</h4>
                  <button type="button" className="btn-close" onClick={() => setShowReceiveModal(false)}></button>
                </div>
                <div className="modal-body fs-5">
                  <div className="alert alert-warning fw-bold">
                    Vui lòng kiểm tra kỹ số lượng thực tế nhận được. Nếu số lượng nhận ít hơn xuất, bắt buộc phải nhập lý do hao hụt (móp méo, hư hỏng, thất lạc...).
                  </div>
                  
                  <div className="table-responsive">
                    <table className="table table-bordered align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Tên sản phẩm</th>
                          <th className="text-center" style={{ width: '120px' }}>SL Xuất</th>
                          <th style={{ width: '180px' }}>SL Thực Nhận</th>
                          <th>Lý do hao hụt (nếu thiếu)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {receiveData.details.map((d, index) => {
                          const isShort = parseInt(d.SOLUONG_NHAN) < parseInt(d.SOLUONG_XUAT);
                          return (
                            <tr key={d.ID_CHITIET}>
                              <td className="fw-bold">{d.TENSP}</td>
                              <td className="text-center fw-bold text-danger fs-4">{d.SOLUONG_XUAT}</td>
                              <td>
                                <input type="number" className={`form-control form-control-lg fw-bold ${isShort ? 'is-invalid text-danger' : 'text-success'}`} min="0" max={d.SOLUONG_XUAT} value={d.SOLUONG_NHAN} onChange={e => {
                                  const newDetails = [...receiveData.details];
                                  newDetails[index].SOLUONG_NHAN = e.target.value;
                                  setReceiveData({...receiveData, details: newDetails});
                                }} required />
                              </td>
                              <td>
                                <input type="text" className={`form-control ${isShort ? 'border-danger' : ''}`} placeholder={isShort ? "Bắt buộc nhập lý do..." : ""} value={d.LYDO_HAOHUT} onChange={e => {
                                  const newDetails = [...receiveData.details];
                                  newDetails[index].LYDO_HAOHUT = e.target.value;
                                  setReceiveData({...receiveData, details: newDetails});
                                }} required={isShort} disabled={!isShort} />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary btn-lg" onClick={() => setShowReceiveModal(false)}>Hủy</button>
                  <button type="submit" className="btn btn-success btn-lg fw-bold"><i className="fa-solid fa-check"></i> Xác Nhận Hàng Vào Kho</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </AdminLayout>
  );
};

export default AdminTransferPage;
