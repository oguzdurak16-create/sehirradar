import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="logo" aria-label="Şehir Radar ana sayfa">
      <span className="logoMark" aria-hidden="true">
        <span />
      </span>
      <span>
        <strong>Şehir</strong>
        <b>Radar</b>
      </span>
    </Link>
  );
}
