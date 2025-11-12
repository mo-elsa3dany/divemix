import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 64,
          background: 'linear-gradient(135deg, #0b1220 0%, #0f172a 100%)',
          color: 'white',
          fontSize: 48,
          fontWeight: 700,
        }}
      >
        <div style={{ opacity: 0.8, fontSize: 28, marginBottom: 12 }}>DiveMix</div>
        <div>Plan dives & build gas mixes.</div>
        <div style={{ fontSize: 24, opacity: 0.8, marginTop: 16 }}>
          Planner · Nitrox · Trimix
        </div>
      </div>
    ),
    { ...size },
  );
}
