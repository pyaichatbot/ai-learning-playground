# Prompt Reality Cockpit – User Stories & Acceptance Criteria

## Epic: Prompt Reality Cockpit (Advanced Mode)

### Story 1: Paste Real Prompt
As a professional user, I want to paste a real production prompt so that I can understand how it behaves under system constraints.

**Acceptance Criteria**
- Single large textarea
- Accepts long prompts (>10k tokens)
- No formatting loss
- Immediate feedback on change

---

### Story 2: Context Budget Visualization
As a user, I want to see how my prompt consumes the context window so that I can understand limits.

**Acceptance Criteria**
- Finite context bar
- Segmented (system, instructions, user, overflow)
- Overflow clearly marked
- Visual updates in real time

---

### Story 3: Instruction Dilution Detection
As a user, I want to know when multiple instructions conflict or dilute clarity.

**Acceptance Criteria**
- Detect multiple role/task instructions
- Trigger “Instruction dilution detected” alert
- Alert explains impact, not solution

---

### Story 4: Cost Impact Awareness
As a user, I want to understand cost implications before production use.

**Acceptance Criteria**
- Per-call cost estimate
- Clear “at scale” wording
- No optimization suggestions

---

### Story 5: Truncation Simulation
As a user, I want to simulate truncation so I can see what the model may ignore.

**Acceptance Criteria**
- Button: Simulate truncation
- Visually fade ignored content
- No auto-correction