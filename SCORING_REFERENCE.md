# Fast Track Leaderboard - Scoring Reference Guide

## 🎯 SCORING FORMULAS

### 1. Speed Score (On-Time Delivery)
```
Formula: (on_time_completed / on_time_total) × 100

Example:
- Client has completed 12 sprints
- 8 were on-time or early
- 4 were late
- Speed Score: (8/12) × 100 = 67%

Color Coding:
🟢 Green (#1DB954):  ≥ 80%
🟠 Amber (#FF9500):  60-79%
🔴 Red (#E50914):    < 60%
```

### 2. Quality Integration Score
```
Formula: Average of all quality scores

Example:
Sprint 1: 85%  Sprint 7:  78%
Sprint 2: 70%  Sprint 8:  82%
Sprint 3: 90%  Sprint 9:  88%
Sprint 4: 65%  Sprint 10: 79%
Sprint 5: 80%  Sprint 11: 81%
Sprint 6: 72%  Sprint 12: 75%

Average: (85+70+90+65+80+72+78+82+88+79+81+75) / 12 = 78.75% → 79%

Color Coding:
🟢 Green (#1DB954):  ≥ 80%
🟠 Amber (#FF9500):  65-79%
🔴 Red (#E50914):    < 65%

Trend Indicator (requires 6+ sprints):
- Last 3 sprints average: (88+79+81) / 3 = 82.67%
- Previous 3 sprints average: (78+82+88) / 3 = 82.67%
- Difference: 0%
- Result: No trend indicator (stable)

Trend Rules:
- If difference > +5: "↑ improving"
- If difference < -5: "↓ declining"
- Otherwise: null (no indicator shown)
```

### 3. Combined Ranking Score
```
Formula: (Speed Score × 0.6) + (Quality Score × 0.4)

Example:
- Speed Score: 67%
- Quality Score: 79%
- Combined: (67 × 0.6) + (79 × 0.4)
         = 40.2 + 31.6
         = 71.8

This combined score determines leaderboard rank.
Sort all clients by combined score (highest = Rank 1)
```

### 4. Rank Calculation
```
Process:
1. Calculate combined score for ALL clients
2. Sort by combined score (descending - highest first)
3. Assign rank numbers (1, 2, 3, ...)
4. Update database with new ranks
5. Store previous rank for arrow indicators

Example Ranking:
Client A: Combined 85.2 → Rank 1
Client B: Combined 82.7 → Rank 2
Client C: Combined 71.8 → Rank 3
Client D: Combined 68.3 → Rank 4
Client E: Combined 65.1 → Rank 5
```

### 5. Rank Change Arrows
```
Logic:
- Lower rank number = Better position
- Compare current_rank vs previous_rank

Examples:
- Was rank 5, now rank 3 → ↑ (improved - GREEN #1DB954)
- Was rank 3, now rank 5 → ↓ (declined - RED #E50914)
- Was rank 3, still rank 3 → → (stable - GRAY #999999)
- First time ranking → null (no arrow shown)
```

---

## 🎨 COLOR PALETTE

### Primary Colors
```
Red (Status/Alerts):      #E50914
Green (Success):          #1DB954
Amber (Warning):          #FF9500
Gray (Neutral):           #999999
```

### Background Colors
```
Dark Background:          #0B0B0B
Card Background:          #212427
White:                    #FFFFFF
```

### Status Colors
```
ON_TIME:                  #1DB954 (Green)
DELAYED:                  #E50914 (Red)
PROGRESS_MEETING:         #999999 (Gray)
GRADUATED:                #999999 (Gray)
STARTING_SOON:            #999999 (Gray)
```

---

## 📏 TYPOGRAPHY SIZES

### Leaderboard Table
```
Rank Numbers:             96px (text-[96px] leading-none)
Score Numbers:            72px (text-[72px] leading-none)
Labels:                   12px (text-xs)
```

### Executive Summary
```
Header:                   24px
Status/Rank:              32px
Metrics:                  48px
Body Text:                14-16px
```

### Mobile View
```
Rank Numbers:             48px (text-[48px] leading-none)
Combined Score:           48px (text-[48px] leading-none)
Team Name:                18px (text-lg)
```

---

## 📊 SCORE CALCULATOR WORKFLOW

### Step 1: Input Data
```
Associate enters:
- Client (dropdown)
- Sprint Number (1-30)
- Deadline Date
- Submission Date
- Quality Score (0-100 slider)
```

### Step 2: Auto-Calculate
```
System calculates:
- Is On Time? (submission_date ≤ deadline_date)
- New On-Time Total = current + 1
- New On-Time Completed = current + (1 if on-time, else 0)
- New Speed Score = (completed / total) × 100
- New Quality Scores Array = [...old_scores, new_score]
- New Quality Average = sum(all_scores) / count(scores)
- Quality Trend = compare last 3 vs previous 3
- New Combined Score = (speed × 0.6) + (quality × 0.4)
```

### Step 3: Preview
```
System displays:
- Speed Score with color coding
- Quality Average with color coding
- Quality Trend (if applicable)
- Combined Score
- Predicted Rank
```

### Step 4: Submit & Recalculate
```
System updates:
1. Update client's scores in database
2. Fetch all clients
3. Calculate combined score for each
4. Sort by combined score
5. Assign new ranks
6. Update all ranks in database
7. Store previous ranks for arrows
8. Refresh dashboard
```

---

## 🔍 QUALITY TREND EXAMPLES

### Example 1: Improving Trend
```
Sprints 1-6: 65, 70, 68, 72, 75, 78
Sprints 7-9: 82, 85, 88

Previous 3 average: (72 + 75 + 78) / 3 = 75%
Last 3 average: (82 + 85 + 88) / 3 = 85%
Difference: 85 - 75 = +10%
Result: "↑ improving" (difference > +5)
```

### Example 2: Declining Trend
```
Sprints 1-6: 85, 88, 90, 87, 86, 84
Sprints 7-9: 78, 75, 72

Previous 3 average: (87 + 86 + 84) / 3 = 85.67%
Last 3 average: (78 + 75 + 72) / 3 = 75%
Difference: 75 - 85.67 = -10.67%
Result: "↓ declining" (difference < -5)
```

### Example 3: Stable (No Indicator)
```
Sprints 1-6: 75, 78, 80, 77, 79, 81
Sprints 7-9: 80, 78, 82

Previous 3 average: (77 + 79 + 81) / 3 = 79%
Last 3 average: (80 + 78 + 82) / 3 = 80%
Difference: 80 - 79 = +1%
Result: null (difference between -5 and +5, no indicator)
```

---

## 📱 MOBILE LAYOUT SPECIFICATIONS

### Desktop (≥ md breakpoint)
```
Shows 8 columns:
1. Rank (with arrow)
2. Team Name
3. Country
4. Sprint
5. On-Time %
6. Quality %
7. Status
8. Actions
```

### Mobile (< md breakpoint)
```
Shows 3 essential items:
1. Rank + Team Name (in header)
2. Status Badge (top-right)
3. Combined Score (center card)
4. VIEW DETAILS button (only for current client)

Current client gets:
- Red left border (#E50914)
- Black background
- White text
```

---

## 🎯 QUICK REFERENCE TABLE

| Metric | Formula | Green | Amber | Red |
|--------|---------|-------|-------|-----|
| Speed Score | (completed/total)×100 | ≥80% | 60-79% | <60% |
| Quality Score | avg(all_scores) | ≥80% | 65-79% | <65% |
| Combined Score | (speed×0.6)+(quality×0.4) | N/A | N/A | N/A |

| Rank Change | Condition | Color | Arrow |
|-------------|-----------|-------|-------|
| Improved | current < previous | #1DB954 | ↑ |
| Declined | current > previous | #E50914 | ↓ |
| Stable | current = previous | #999999 | → |
| New | no previous_rank | - | null |

---

## 🚨 IMPORTANT RULES

1. **Combined score determines rank** - NOT individual speed or quality scores
2. **Lower rank number = Better position** (Rank 1 is best)
3. **Quality trend requires 6+ sprints** - Won't show until at least 6 sprints completed
4. **On-time is binary** - Either on-time (≤ deadline) or late (> deadline)
5. **Ranks recalculate on every score update** - All client ranks may change
6. **NO YELLOW/AMBER colors in UI** - Only #FF9500 for warning states in metrics

---

**Last Updated:** October 16, 2025

