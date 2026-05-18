import { useState, useEffect, useCallback } from 'react';
import ActionIcon from '../../components/ui/ActionIcon';
import { useNavigate } from 'react-router-dom';
import { laporanService } from '../../services/laporanService';
import './LaporanRapat.css';

interface Room { id: number; name: string; }
interface LaporanItem {
  id: number; title: string; organizer: string; start_time: string; end_time: string; status: string;
  room: Room | null;
  lampiran: { has_undangan: boolean; has_notulensi: boolean; has_dokumentasi: boolean; };
}
interface PagMeta { current_page: number; last_page: number; total: number; }

function fmtDate(d: string) { return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }); }
function fmtTime(d: string) { return new Date(d).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }); }
function statusLabel(s: string) { return { menunggu: 'Menunggu', berlangsung: 'Berlangsung', selesai: 'Selesai', dibatalkan: 'Dibatalkan' }[s] || s; }

export default function LaporanRapat() {
  const navigate = useNavigate();
  const [items, setItems] = useState<LaporanItem[]>([]);
  const [meta, setMeta] = useState<PagMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, per_page: 25 };
      if (search) params.search = search;
      if (date) params.date = date;
      if (status) params.status = status;
      const res = await laporanService.getList(params);
      const pg = res.data?.data;
      setItems(pg?.data || []);
      setMeta({ current_page: pg?.current_page || 1, last_page: pg?.last_page || 1, total: pg?.total || 0 });
    } catch { setItems([]); } finally { setLoading(false); }
  }, [search, date, status, page]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400); return () => clearTimeout(t); }, [searchInput]);

  return (
    <div className="laporan-page">
      <div className="laporan-page-header">
        <h1>Laporan Rapat</h1>
        <p>Lihat dan kelola laporan rapat RS Citra Husada</p>
      </div>

      <div className="laporan-filter">
        <div className="laporan-filter-title">
          <svg viewBox="0 0 24 24"><path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/></svg>
          Filter Laporan
        </div>
        <div className="laporan-filter-row">
          <div className="laporan-filter-group">
            <label>Cari Rapat</label>
            <div className="search-input-wrap">
              <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
              <input type="text" placeholder="Cari judul rapat atau ruangan..." value={searchInput} onChange={e => setSearchInput(e.target.value)} />
            </div>
          </div>
          <div className="laporan-filter-group">
            <label>Tanggal</label>
            <input type="date" value={date} onChange={e => { setDate(e.target.value); setPage(1); }} />
          </div>
          <div className="laporan-filter-group">
            <label>Status</label>
            <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
              <option value="">Semua Status</option>
              <option value="menunggu">Menunggu</option>
              <option value="berlangsung">Berlangsung</option>
              <option value="selesai">Selesai</option>
              <option value="dibatalkan">Dibatalkan</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="laporan-loading"><div className="laporan-loading-spinner" />Memuat data laporan...</div>
      ) : items.length === 0 ? (
        <div className="laporan-table-wrap"><div className="laporan-empty">Tidak ada data laporan rapat ditemukan.</div></div>
      ) : (
        <>
          <div className="laporan-table-wrap">
            <table className="laporan-table">
              <thead><tr><th>Judul Rapat</th><th>Tanggal</th><th>Penyelenggara</th><th>Lampiran</th><th>Status</th><th>Aksi</th></tr></thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td><div className="laporan-title-cell"><span className="laporan-title-main">{item.title}</span><span className="laporan-title-sub">{item.room?.name || '-'} • {fmtTime(item.start_time)} - {fmtTime(item.end_time)}</span></div></td>
                    <td>{fmtDate(item.start_time)}</td>
                    <td>{item.organizer || '-'}</td>
                    <td>
                      <div className="laporan-lampiran">
                        <span className="laporan-lampiran-item"><span className={`ind-dot ${item.lampiran.has_undangan ? 'green' : 'red'}`} />Undangan</span>
                        <span className="laporan-lampiran-item"><span className={`ind-dot ${item.lampiran.has_notulensi ? 'green' : 'red'}`} />Notulensi</span>
                        <span className="laporan-lampiran-item"><span className={`ind-dot ${item.lampiran.has_dokumentasi ? 'green' : 'red'}`} />Dokumentasi</span>
                      </div>
                    </td>
                    <td><span className={`laporan-status ${item.status}`}>{statusLabel(item.status)}</span></td>
                    <td>
                      <div className="laporan-actions">
                        <button className="laporan-action-btn view" title="Lihat Detail" onClick={() => navigate(`/laporan/${item.id}`)}>
                          <ActionIcon name="mata" size={18} />
                        </button>
                        <button className="laporan-action-btn download" title="Download" onClick={() => navigate(`/laporan/${item.id}`)}>
                          <ActionIcon name="unduh" size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {meta && meta.last_page > 1 && (
            <div className="laporan-pagination">
              <button disabled={meta.current_page <= 1} onClick={() => setPage(p => p - 1)}>← Sebelumnya</button>
              {Array.from({ length: meta.last_page }, (_, i) => i + 1).map(p => (
                <button key={p} className={p === meta.current_page ? 'active' : ''} onClick={() => setPage(p)}>{p}</button>
              ))}
              <button disabled={meta.current_page >= meta.last_page} onClick={() => setPage(p => p + 1)}>Selanjutnya →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
