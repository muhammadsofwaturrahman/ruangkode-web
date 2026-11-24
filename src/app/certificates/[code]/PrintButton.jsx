"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-lg bg-gradient-to-r from-[#F806CC] to-[#A91079] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#F806CC]/20 transition hover:opacity-90"
    >
      Cetak / Simpan PDF
    </button>
  );
}