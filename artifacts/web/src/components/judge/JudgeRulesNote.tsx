/** قواعد البطولة as the organiser wrote them, shown on the judging links. */
export default function JudgeRulesNote({ rules }: { rules?: string }) {
  if (!rules?.trim()) return null;
  return (
    <div
      style={{
        background: "#29ABE20d",
        border: "1px solid #29ABE233",
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
      }}
      data-testid="judge-rules"
    >
      <div style={{ fontSize: 12, fontWeight: 700, color: "#0a6b91", marginBottom: 4 }}>
        📜 قواعد البطولة
      </div>
      <div style={{ fontSize: 13, whiteSpace: "pre-wrap", lineHeight: 1.6, color: "#2B1B45" }}>
        {rules.trim()}
      </div>
    </div>
  );
}
