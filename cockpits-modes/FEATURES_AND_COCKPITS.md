# Features & Cockpits Specification

## Mental Model
The Playground grows via **cockpits**, not features.

Each cockpit answers one uncomfortable systems question.

---

## Cockpit List

### 1. Prompt Reality Cockpit
**Question:** What actually happens to my prompt before the model responds?

**Key Features:**
- Context window visualization
- Token pressure indicators
- Instruction dilution detection
- Truncation simulation
- Per-call cost estimation

---

### 2. Retrieval Reality Cockpit (Future)
**Question:** What actually gets retrieved and why?

**Key Features:**
- Chunk ordering visualization
- Recall vs precision indicators
- Retrieval noise exposure
- Context pollution simulation

---

### 3. Cost Reality Cockpit (Future)
**Question:** Where does the money really go?

**Key Features:**
- Fixed vs variable cost modeling
- Scale-based cost simulation
- Retry amplification visualization
- Model pricing impact

---

### 4. Agent Reality Cockpit (Future)
**Question:** Where does autonomy break down?

**Key Features:**
- Planning drift visualization
- Tool misuse scenarios
- Loop detection
- Decision boundary exposure

---

## Anti-Features (Explicitly Excluded)
- Auto prompt fixing
- AI-generated suggestions
- Best-practice checklists
- Model tuning controls

---

## Navigation Rules
- No tabs inside a cockpit
- Cockpits are mode switches
- Advanced Mode only shows one cockpit at a time