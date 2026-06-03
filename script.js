
// ── DATA ─────────────────────────────────
const STORAGE_KEY = 'nusabank_data';

let state = {
  saldo: 0,
  transaksi: []   // { id, tanggal, keterangan, jenis, jumlah, saldoAkhir }
};

// ── UTILS ────────────────────────────────

function formatRupiah(angka) {
  if (angka === 0) return 'Rp 0';
  return 'Rp ' + angka.toLocaleString('id-ID');
}

function formatTanggal(str) {
  // str = "YYYY-MM-DD"
  const [y, m, d] = str.split('-');
  const bulan = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  return `${parseInt(d)} ${bulan[parseInt(m) - 1]} ${y}`;
}

function simpan() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function muat() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try { state = JSON.parse(raw); } catch (_) {}
  }
}

function tampilkanToast(pesan) {
  const toast = document.getElementById('toast');
  toast.textContent = pesan;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}

// ── RENDER ───────────────────────────────

function renderSaldo() {
  document.getElementById('saldo-display').textContent = formatRupiah(state.saldo);
}

function renderStats() {
  const masuk  = state.transaksi.filter(t => t.jenis === 'setoran').reduce((a, t) => a + t.jumlah, 0);
  const keluar = state.transaksi.filter(t => t.jenis === 'penarikan').reduce((a, t) => a + t.jumlah, 0);
  document.getElementById('total-masuk').textContent       = formatRupiah(masuk);
  document.getElementById('total-keluar').textContent      = formatRupiah(keluar);
  document.getElementById('jumlah-transaksi').textContent  = state.transaksi.length;

  // Animasi bounce kecil pada nilai stats
  ['total-masuk','total-keluar','jumlah-transaksi'].forEach(id => {
    const el = document.getElementById(id);
    el.style.transform = 'scale(1.12)';
    setTimeout(() => el.style.transform = 'scale(1)', 200);
  });
}

function renderTabel() {
  const tbody      = document.getElementById('tabel-transaksi');
  const emptyState = document.getElementById('empty-state');
  tbody.innerHTML  = '';

  if (state.transaksi.length === 0) {
    emptyState.classList.add('show');
    return;
  }
  emptyState.classList.remove('show');

  state.transaksi.forEach((t, i) => {
    const tr = document.createElement('tr');
    tr.style.animationDelay = `${i * 35}ms`;

    const setoran   = t.jenis === 'setoran'   ? formatRupiah(t.jumlah) : '—';
    const penarikan = t.jenis === 'penarikan' ? formatRupiah(t.jumlah) : '—';

    tr.innerHTML = `
      <td>${state.transaksi.length - i}</td>
      <td class="td-date">${formatTanggal(t.tanggal)}</td>
      <td class="td-ket">${escapeHtml(t.keterangan) || '<em style="color:var(--gray-3)">–</em>'}</td>
      <td class="td-setoran">${setoran}</td>
      <td class="td-penarikan">${penarikan}</td>
      <td class="td-saldo">${formatRupiah(t.saldoAkhir)}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderSemua() {
  renderSaldo();
  renderStats();
  renderTabel();
}

// ── AKSI ─────────────────────────────────

function tambahTransaksi() {
  const jenis      = document.getElementById('jenis').value;
  const jumlah     = parseInt(document.getElementById('jumlah').value, 10);
  const keterangan = document.getElementById('keterangan').value.trim();
  const tanggal    = document.getElementById('tanggal').value;
  const errEl      = document.getElementById('form-error');

  errEl.textContent = '';

  // Validasi
  if (!tanggal) {
    errEl.textContent = '⚠ Tanggal wajib diisi.';
    document.getElementById('tanggal').focus();
    return;
  }
  if (!jumlah || jumlah < 1000) {
    errEl.textContent = '⚠ Jumlah minimal Rp 1.000.';
    document.getElementById('jumlah').focus();
    return;
  }
  if (jenis === 'penarikan' && jumlah > state.saldo) {
    errEl.textContent = `⚠ Saldo tidak cukup! Saldo Anda: ${formatRupiah(state.saldo)}`;
    return;
  }

  // Update saldo
  if (jenis === 'setoran') {
    state.saldo += jumlah;
  } else {
    state.saldo -= jumlah;
  }

  // Simpan transaksi (urutan terbaru di atas)
  const trx = {
    id: Date.now(),
    tanggal,
    keterangan,
    jenis,
    jumlah,
    saldoAkhir: state.saldo
  };
  state.transaksi.unshift(trx);

  simpan();
  renderSemua();

  // Reset form
  document.getElementById('jumlah').value      = '';
  document.getElementById('keterangan').value  = '';

  const emoji = jenis === 'setoran' ? '💰' : '💸';
  const label = jenis === 'setoran' ? 'Setoran' : 'Penarikan';
  tampilkanToast(`${emoji} ${label} ${formatRupiah(jumlah)} berhasil dicatat!`);
}

function resetData() {
  if (!confirm('Reset semua data transaksi? Tindakan ini tidak bisa dibatalkan.')) return;
  state = { saldo: 0, transaksi: [] };
  simpan();
  renderSemua();
  tampilkanToast('🗑 Data berhasil direset.');
}

// ── HELPER ───────────────────────────────

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── INIT ─────────────────────────────────

(function init() {
  // Set tanggal hari ini sebagai default
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('tanggal').value = today;

  // Enter di field form = submit
  ['jumlah','keterangan','tanggal'].forEach(id => {
    document.getElementById(id).addEventListener('keydown', e => {
      if (e.key === 'Enter') tambahTransaksi();
    });
  });

  // Format input jumlah agar tidak bisa negatif
  document.getElementById('jumlah').addEventListener('input', function () {
    if (this.value < 0) this.value = 0;
  });

  // Muat data dari localStorage
  muat();
  renderSemua();
})();
