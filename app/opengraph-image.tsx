import { ImageResponse } from "next/og";

export const alt = "Şehir Radar - Bursa şehir bilgi platformu";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "72px 82px",
          background: "#061b15",
          color: "white",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", width: 720 }}>
          <span style={{ color: "#7be8ad", fontSize: 26, letterSpacing: 2 }}>BURSA CANLI ŞEHİR VERİSİ</span>
          <strong style={{ fontSize: 82, lineHeight: 1.02, marginTop: 24 }}>Şehrinde bugün ne oluyor?</strong>
          <span style={{ color: "#b8c9c1", fontSize: 30, marginTop: 30 }}>Kesintiler · Başvurular · Etkinlikler</span>
        </div>
        <div style={{ width: 300, height: 300, border: "8px solid #37d987", borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 45px rgba(55,217,135,.10)" }}>
          <div style={{ width: 160, height: 160, border: "5px solid #37d987", borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 54, height: 54, background: "#37d987", borderRadius: 999 }} />
          </div>
        </div>
      </div>
    ),
    size
  );
}
