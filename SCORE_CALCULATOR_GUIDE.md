# Score Calculator - Quick Start Guide

## 📍 Location
The Score Calculator appears at the top of the Associate Dashboard, right after the "Create New Client" button.

**Path:** Associate Dashboard → Score Calculator (Section 3.5)

---

## 🎯 Purpose
The Score Calculator allows associates to:
1. Enter sprint completion data for clients
2. Automatically calculate all scoring metrics
3. Update the leaderboard rankings in real-time
4. Preview score changes before submitting

---

## 📝 How to Use

### Step 1: Select Client
1. Click the "Select Client" dropdown
2. Choose the client you want to update
3. Current rank will be shown next to the client name

### Step 2: Enter Sprint Information

**Sprint Number:**
- Enter the sprint number (1-30)
- This should be the sprint that was just completed

**Quality Score:**
- Use the slider to set quality (0-100)
- The percentage displays in large text below the slider
- This represents the quality of the sprint deliverable

### Step 3: Set Dates

**Deadline:**
- Select the original deadline date for this sprint
- This is when the sprint was supposed to be completed

**Submission Date:**
- Select when the client actually submitted the sprint
- This determines if the sprint was on-time or late

### Step 4: Review On-Time Status

The calculator automatically determines if the sprint is on-time:
- ✅ **ON TIME** = Submission date ≤ Deadline date (GREEN)
- ❌ **LATE** = Submission date > Deadline date (RED)

**Manual Override:**
If you need to override the automatic calculation:
1. Check "Manual override"
2. Check/uncheck the override checkbox to set on-time status

### Step 5: Preview Updated Scores

The preview panel (black background) shows:

**Speed Score:**
- New on-time delivery percentage
- Color coded (Green ≥80%, Amber 60-79%, Red <60%)
- Shows fraction (e.g., "9/13 on-time")

**Quality Average:**
- New average quality score across all sprints
- Color coded (Green ≥80%, Amber 65-79%, Red <65%)
- Shows trend if 6+ sprints completed

**Combined Score:**
- The final ranking score
- Calculated as (Speed × 0.6) + (Quality × 0.4)

**Predicted Rank:**
- Shows what rank the client will have after update
- Format: "#3 of 12" (predicted rank out of total clients)

### Step 6: Submit

1. Click "UPDATE SCORES & RECALCULATE RANKS"
2. Wait for confirmation message
3. Dashboard will automatically refresh with new data

---

## ✅ Success Message
After successful submission, you'll see:
```
✅ Scores updated successfully! Rank recalculated. 
   [Client Name] is now predicted rank #X
```

## ❌ Error Messages

**"Please select a client"**
- No client was selected from dropdown
- Solution: Select a client before submitting

**"Sprint number must be between 1 and 30"**
- Invalid sprint number entered
- Solution: Enter a number from 1 to 30

**"Please select a deadline"**
- No deadline date selected
- Solution: Choose a deadline date

**"Please select a submission date"**
- No submission date selected
- Solution: Choose a submission date

**"❌ Failed to update scores. Please try again."**
- Database error occurred
- Solution: Check internet connection and retry

---

## 📊 Example Walkthrough

### Scenario: Updating Sprint 12 for "Acme Corp"

**Current Stats:**
- Rank: 5
- On-Time Delivery: 8/11 (73%)
- Quality Average: 74%
- Combined Score: 73.4

**New Sprint Data:**
- Sprint Number: 12
- Deadline: October 15, 2025
- Submission Date: October 14, 2025 (1 day early!)
- Quality Score: 85% (great work!)

**What Happens:**

1. **Select Client:** "Acme Corp (Current Rank: #5)"

2. **Enter Data:**
   - Sprint: 12
   - Quality: 85 (slide to 85)
   - Deadline: Oct 15, 2025
   - Submission: Oct 14, 2025

3. **Auto-Calculation Shows:**
   - ✅ ON TIME (submitted 1 day early)

4. **Preview Displays:**
   ```
   Speed Score: 75% (GREEN)
   9/12 on-time

   Quality Average: 75% (AMBER)
   (Target: 80%)

   Combined Score: 75.0

   Predicted Rank: #4 of 12
   ```

5. **Analysis:**
   - Speed improved from 73% to 75% (+2%)
   - Quality improved from 74% to 75% (+1%)
   - Combined improved from 73.4 to 75.0 (+1.6)
   - Rank will improve from #5 to #4 (↑)

6. **Submit:**
   - Click "UPDATE SCORES & RECALCULATE RANKS"
   - Success! ✅
   - Dashboard refreshes
   - Acme Corp now shows Rank #4 with ↑ arrow

---

## 🎯 Best Practices

### When to Use the Calculator
- ✅ After each sprint is completed and reviewed
- ✅ When you receive the final sprint deliverable
- ✅ During weekly client check-ins
- ✅ When quality scores are finalized

### When NOT to Use
- ❌ Before sprint is actually completed
- ❌ If you don't have the quality score yet
- ❌ For preliminary/draft submissions
- ❌ To test "what-if" scenarios (use once for actual data)

### Data Entry Tips
1. **Double-check dates** - Wrong dates affect on-time status
2. **Be consistent with quality scoring** - Use the same criteria for all clients
3. **Enter sprints in order** - Don't skip sprint numbers
4. **One sprint at a time** - Don't batch-enter multiple sprints
5. **Verify before submitting** - Check the preview carefully

### Quality Score Guidelines
- **90-100%:** Exceptional work, exceeded expectations
- **80-89%:** Good work, met all requirements
- **70-79%:** Acceptable work, met most requirements
- **60-69%:** Below expectations, needs improvement
- **Below 60%:** Poor quality, requires rework

---

## 📈 Understanding the Rankings

### How Rankings Work
1. Each client gets a **Speed Score** (on-time %)
2. Each client gets a **Quality Score** (average %)
3. System calculates **Combined Score** = (Speed × 0.6) + (Quality × 0.4)
4. All clients sorted by Combined Score (highest first)
5. Rankings assigned: Rank 1, 2, 3, etc.

### Speed is Weighted Higher
- Speed contributes 60% to combined score
- Quality contributes 40% to combined score
- This emphasizes the importance of on-time delivery

### Example Comparison
**Client A:**
- Speed: 90% (excellent)
- Quality: 70% (acceptable)
- Combined: (90×0.6) + (70×0.4) = 54 + 28 = 82

**Client B:**
- Speed: 70% (acceptable)
- Quality: 90% (excellent)
- Combined: (70×0.6) + (90×0.4) = 42 + 36 = 78

**Result:** Client A ranks higher because speed is weighted more heavily!

---

## 🔍 Troubleshooting

### Preview Not Showing
- **Cause:** No client selected
- **Fix:** Select a client from dropdown

### Wrong On-Time Status
- **Cause:** Dates entered incorrectly
- **Fix:** Double-check deadline and submission dates

### Predicted Rank Seems Wrong
- **Cause:** Other clients may have better combined scores
- **Fix:** This is normal - rankings are relative to all clients

### "UPDATING..." Stuck
- **Cause:** Network or database issue
- **Fix:** Refresh page and try again

### Quality Trend Not Showing
- **Cause:** Client has fewer than 6 completed sprints
- **Fix:** This is expected - trend requires 6+ sprints

---

## 💡 Pro Tips

1. **Use the preview extensively** - It shows exactly what will happen before you commit

2. **Watch for rank changes** - If a client's predicted rank is better/worse than current, it shows progress

3. **Quality trends are valuable** - When they appear (6+ sprints), use them to coach clients

4. **Combined score matters most** - Don't focus only on speed or quality individually

5. **Regular updates keep rankings accurate** - Update scores weekly for best results

6. **Document your quality scoring** - Keep notes on why you assigned each quality score

---

## 📞 Support

If you encounter issues or have questions:

1. Check this guide first
2. Review the SCORING_REFERENCE.md for formula details
3. Check REBUILD_SUMMARY.md for technical details
4. Contact system administrator if issues persist

---

## 🎓 Training Checklist

Before using the Score Calculator independently:

- [ ] Read this entire guide
- [ ] Understand the scoring formulas (see SCORING_REFERENCE.md)
- [ ] Know what each score means (speed, quality, combined)
- [ ] Understand how rankings work
- [ ] Know when to use manual override
- [ ] Familiar with the preview panel
- [ ] Understand quality trend indicators
- [ ] Know how to interpret predicted ranks
- [ ] Practiced with test data (if available)

---

**Last Updated:** October 16, 2025
**Version:** 1.0

