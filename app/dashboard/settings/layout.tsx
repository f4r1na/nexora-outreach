import SettingsSidebar from "./_components/SettingsSidebar";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 32, minHeight: "calc(100vh - 60px)" }}>
      <SettingsSidebar />
      <main
        style={{
          flex: 1,
          padding: "40px 48px",
          overflowY: "auto",
          maxWidth: 900,
        }}
      >
        {children}
      </main>
    </div>
  );
}
