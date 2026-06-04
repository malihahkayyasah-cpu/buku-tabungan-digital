
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
  if (!toast) return;
  toast.textContent = pesan;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}

// ── RENDER ───────────────────────────────

function renderSaldo() {
  const el = document.getElementById('saldo-display');
  if (el) el.textContent = formatRupiah(state.saldo);
}

function renderStats() {
  const masuk  = state.transaksi.filter(t => t.jenis === 'setoran').reduce((a, t) => a + t.jumlah, 0);
  const keluar = state.transaksi.filter(t => t.jenis === 'penarikan').reduce((a, t) => a + t.jumlah, 0);

  const elMasuk = document.getElementById('total-masuk');
  const elKeluar = document.getElementById('total-keluar');
  const elJumlah = document.getElementById('jumlah-transaksi');

  if (elMasuk)  elMasuk.textContent  = formatRupiah(masuk);
  if (elKeluar) elKeluar.textContent = formatRupiah(keluar);
  if (elJumlah) elJumlah.textContent = state.transaksi.length;

  // Animasi bounce kecil pada nilai stats
  ['total-masuk','total-keluar','jumlah-transaksi'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.transform = 'scale(1.12)';
    setTimeout(() => el.style.transform = 'scale(1)', 200);
  });
}

function renderTabel() {
  const tbody      = document.getElementById('tabel-transaksi');
  const emptyState = document.getElementById('empty-state');
  if (!tbody || !emptyState) return;

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

// ══════════════════════════════════════════
// KUIS FINANSIAL
// ══════════════════════════════════════════

const KUIS_JAWABAN = [
  {
    jawaban: 'a',
    benar: 'Kenaikan harga barang secara umum dan terus-menerus',
    penjelasan: 'Inflasi adalah kenaikan harga barang dan jasa secara umum dan terus-menerus dalam jangka waktu tertentu.'
  },
  {
    jawaban: 'b',
    benar: 'Untuk mencatat transaksi keuangan nasabah di bank',
    penjelasan: 'Buku tabungan berfungsi sebagai bukti pencatatan transaksi keuangan nasabah seperti setoran, penarikan, dan saldo.'
  },
  {
    jawaban: 'c',
    benar: 'Imbalan yang diberikan bank kepada nasabah atas simpanannya',
    penjelasan: 'Bunga bank adalah imbalan berupa persentase tertentu yang diberikan bank kepada nasabah atas dana yang disimpan.'
  },
  {
    jawaban: 'c',
    benar: 'Penanaman modal dengan harapan mendapat keuntungan di masa depan',
    penjelasan: 'Investasi adalah penanaman uang atau modal pada suatu instrumen dengan harapan mendapat keuntungan (return) di kemudian hari.'
  },
  {
    jawaban: 'b',
    benar: 'Menyebarkan investasi ke berbagai instrumen untuk mengurangi risiko',
    penjelasan: 'Diversifikasi adalah strategi menyebarkan investasi ke beberapa instrumen berbeda agar risiko kerugian dapat diminimalkan.'
  }
];

function cekKuis() {
  let skor = 0;
  const totalSoal = KUIS_JAWABAN.length;

  for (let i = 0; i < totalSoal; i++) {
    const selected = document.querySelector(`input[name="q${i}"]:checked`);
    const feedbackEl = document.getElementById(`feedback-${i}`);
    const cardEl = document.getElementById(`quiz-card-${i}`);

    // Reset classes
    feedbackEl.classList.remove('show', 'correct-feedback', 'wrong-feedback');
    cardEl.classList.remove('correct', 'wrong');

    if (!selected) {
      // Belum dijawab
      feedbackEl.innerHTML = '⚠️ Kamu belum menjawab soal ini.';
      feedbackEl.classList.add('show', 'wrong-feedback');
      cardEl.classList.add('wrong');
      continue;
    }

    const jawabanUser = selected.value;
    const kunci = KUIS_JAWABAN[i];

    if (jawabanUser === kunci.jawaban) {
      // Benar
      skor++;
      feedbackEl.innerHTML = '✅ <strong>Benar!</strong> ' + kunci.penjelasan;
      feedbackEl.classList.add('show', 'correct-feedback');
      cardEl.classList.add('correct');
    } else {
      // Salah
      feedbackEl.innerHTML = `❌ <strong>Salah!</strong> Jawaban yang benar: <strong>${kunci.benar}</strong>. ${kunci.penjelasan}`;
      feedbackEl.classList.add('show', 'wrong-feedback');
      cardEl.classList.add('wrong');
    }

    // Disable radio buttons setelah dicek
    const radios = document.querySelectorAll(`input[name="q${i}"]`);
    radios.forEach(r => r.disabled = true);
  }

  // Tampilkan hasil
  const resultEl = document.getElementById('quiz-result');
  resultEl.classList.remove('show', 'score-great', 'score-ok', 'score-low');

  let scoreClass, resultText;
  if (skor === totalSoal) {
    scoreClass = 'score-great';
    resultText = '🎉 Luar biasa! Kamu menguasai materi finansial dengan sempurna!';
  } else if (skor >= 3) {
    scoreClass = 'score-ok';
    resultText = '👍 Bagus! Pengetahuan finansialmu sudah cukup baik. Terus belajar ya!';
  } else {
    scoreClass = 'score-low';
    resultText = '📚 Jangan menyerah! Pelajari lagi materi finansial dan coba lagi.';
  }

  resultEl.innerHTML = `
    <p class="result-score">${skor} / ${totalSoal}</p>
    <p class="result-text">${resultText}</p>
  `;
  resultEl.classList.add('show', scoreClass);

  // Tampilkan tombol ulangi, sembunyikan tombol cek
  const btnCek = document.getElementById('btn-cek-kuis');
  const btnReset = document.getElementById('btn-reset-kuis');
  if (btnCek) btnCek.style.display = 'none';
  if (btnReset) btnReset.style.display = 'inline-flex';

  // Scroll ke hasil
  resultEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function resetKuis() {
  const totalSoal = KUIS_JAWABAN.length;

  for (let i = 0; i < totalSoal; i++) {
    // Reset radio buttons
    const radios = document.querySelectorAll(`input[name="q${i}"]`);
    radios.forEach(r => {
      r.disabled = false;
      r.checked = false;
    });

    // Reset feedback
    const feedbackEl = document.getElementById(`feedback-${i}`);
    feedbackEl.classList.remove('show', 'correct-feedback', 'wrong-feedback');
    feedbackEl.innerHTML = '';

    // Reset card styling
    const cardEl = document.getElementById(`quiz-card-${i}`);
    cardEl.classList.remove('correct', 'wrong');
  }

  // Reset result
  const resultEl = document.getElementById('quiz-result');
  resultEl.classList.remove('show', 'score-great', 'score-ok', 'score-low');
  resultEl.innerHTML = '';

  // Tampilkan tombol cek, sembunyikan tombol ulangi
  const btnCek = document.getElementById('btn-cek-kuis');
  const btnReset = document.getElementById('btn-reset-kuis');
  if (btnCek) btnCek.style.display = 'inline-flex';
  if (btnReset) btnReset.style.display = 'none';

  // Scroll ke atas kuis
  const quizSection = document.querySelector('.quiz-section');
  if (quizSection) quizSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── INIT ─────────────────────────────────

(function init() {
  // Set tanggal hari ini sebagai default (hanya di halaman product)
  const tanggalEl = document.getElementById('tanggal');
  if (tanggalEl) {
    const today = new Date().toISOString().split('T')[0];
    tanggalEl.value = today;
  }

  // Enter di field form = submit (hanya di halaman product)
  ['jumlah','keterangan','tanggal'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter') tambahTransaksi();
      });
    }
  });

  // Format input jumlah agar tidak bisa negatif
  const jumlahEl = document.getElementById('jumlah');
  if (jumlahEl) {
    jumlahEl.addEventListener('input', function () {
      if (this.value < 0) this.value = 0;
    });
  }

  // Muat data dari localStorage & render (hanya kalau elemen product ada)
  if (document.getElementById('saldo-display')) {
    muat();
    renderSemua();
  }
})();
