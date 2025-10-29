# 🧪 SIMPLE TESTING GUIDE FOR NON-DEVELOPERS

**Who This Is For:** Anyone who needs to test the Fast Track Leaderboard without technical knowledge  
**Time Required:** 30-45 minutes  
**Tools Needed:** Web browser, access to database

---

## 🚀 SETUP

### **Step 1: Start the Development Server**

1. Open your terminal/command prompt
2. Navigate to the project folder:
   ```
   cd fast-track-leaderboard
   ```
3. Run the development server:
   ```
   npm run dev
   ```
4. Wait for it to say "Ready" (usually 10-20 seconds)
5. Open your browser and go to: **http://localhost:3000**

**EXPECTED:** You should see the login page with an access code input field

---

## ✅ TEST 1: Can You See the Score Calculator?

### **Goal:** Verify the Score Calculator component appears on the Associate Dashboard

**Steps:**
1. On the login page, enter access code: `ELENA001` (or any associate code)
2. Press Enter or click Submit
3. You should land on the Associate Dashboard
4. Scroll down past the "Hello, Elena!" greeting
5. Look for a white card section labeled **"Score Calculator"**

**EXPECTED RESULT:**
- ✅ You see a white card with "Score Calculator" at the top
- ✅ There's a dropdown that says "Select Client"
- ✅ There's a sprint number input field
- ✅ There are two date pickers (Deadline and Submission Date)
- ✅ There's a slider for Quality Score (0-100)
- ✅ There's a black preview panel below the form
- ✅ There's a red button that says "UPDATE SCORES & RECALCULATE RANKS"

**IF YOU DON'T SEE THIS:**
- ❌ The ScoreCalculator was not properly integrated
- Report: "Score Calculator missing from Associate Dashboard"

---

## ✅ TEST 2: Can You Select a Client?

### **Goal:** Verify the client dropdown is populated

**Steps:**
1. Still on the Associate Dashboard with Score Calculator visible
2. Click on the "Select Client" dropdown
3. Look at the options that appear

**EXPECTED RESULT:**
- ✅ You see a list of client names
- ✅ Each client shows their current rank (e.g., "Acme Corp (Current Rank: #3)")
- ✅ At least one client is available to select

**IF YOU DON'T SEE THIS:**
- ❌ Either no clients exist in the database, or the dropdown isn't loading data
- Report: "Client dropdown is empty or not working"

---

## ✅ TEST 3: Does the Live Preview Work?

### **Goal:** Verify the preview panel updates as you enter data

**Steps:**
1. Select ANY client from the dropdown
2. Enter sprint number: **5**
3. Move the Quality Score slider to **85**
4. Pick TODAY's date for both Deadline and Submission Date
5. Look at the black preview panel below

**EXPECTED RESULT:**
- ✅ The preview panel shows updated numbers
- ✅ You see "Speed Score" with a percentage
- ✅ You see "Quality Average" with a percentage
- ✅ You see "Combined Score" with a decimal number
- ✅ You see "Predicted Rank: #X of Y"
- ✅ The numbers change when you move the slider

**IF YOU DON'T SEE THIS:**
- ❌ The live preview calculation isn't working
- Report: "Preview panel doesn't update or shows errors"

---

## ✅ TEST 4: Can You Submit a Score? ⚠️ (Uses Real Database)

### **Goal:** Test the full score submission and rank recalculation

**Steps:**
1. Select a client (pick one with fewer than 30 sprints completed)
2. Enter a sprint number that HASN'T been completed yet (check client details)
3. Set Quality Score to: **80**
4. Set Deadline to: **Tomorrow's date**
5. Set Submission Date to: **Today's date** (should be ON TIME)
6. Click **"UPDATE SCORES & RECALCULATE RANKS"**

**EXPECTED RESULT:**
- ✅ Button changes to "UPDATING..."
- ✅ After 2-5 seconds, you see a GREEN success message
- ✅ Message says something like: "✅ Scores updated successfully! Rank recalculated. [Client Name] is now predicted rank #X"
- ✅ The form resets (all fields cleared)
- ✅ The page refreshes or data updates

**IF YOU DON'T SEE THIS:**
- ❌ Database update failed
- Check: Did you get an error message? What did it say?
- Report: "Score submission failed" + the error message you saw

---

## ✅ TEST 5: Try to Enter a Duplicate Sprint

### **Goal:** Verify duplicate sprint detection works

**Steps:**
1. Find a client who has completed at least one sprint (check their card or details)
2. Select that client
3. Enter a sprint number they've ALREADY completed (e.g., if they completed sprint 5, enter 5 again)
4. Fill in all other fields
5. Click submit

**EXPECTED RESULT:**
- ✅ You see a RED error message
- ✅ Message says: "Sprint X has already been completed for [Client Name]. Please select a different sprint number."
- ✅ The form does NOT submit
- ✅ No database update happens

**IF YOU DON'T SEE THIS:**
- ❌ Duplicate detection isn't working
- Report: "Duplicate sprint was allowed to be submitted"

---

## ✅ TEST 6: Check Rank Changes in Leaderboard

### **Goal:** Verify ranks update and arrows appear

**Steps:**
1. After submitting a score (Test 4), note which client you updated
2. Go to the CLIENT dashboard (login with a client access code like `CFL2025`)
3. Look at the leaderboard table
4. Find the client you just updated
5. Look at their rank number

**EXPECTED RESULT:**
- ✅ Rank numbers are HUGE (96px font size on desktop)
- ✅ You see an arrow next to some rank numbers: ↑ ↓ or →
- ✅ Arrows are colored:
  - Green ↑ = rank improved
  - Red ↓ = rank declined
  - Gray → = rank stayed same
- ✅ The current client (the one logged in) has a RED left border

**IF YOU DON'T SEE THIS:**
- ❌ Rank recalculation or arrows not working
- Report: "Ranks didn't update" or "Arrows missing" or "Wrong border color"

---

## ✅ TEST 7: Check Executive Summary

### **Goal:** Verify the redesigned Executive Summary displays correctly

**Steps:**
1. Still on the client dashboard
2. Scroll to the very top
3. Look at the first section (should have a dark background and red left border)

**EXPECTED RESULT:**
- ✅ Background is VERY DARK gray (almost black: #0B0B0B)
- ✅ There's a RED left border (not white, not black)
- ✅ You see 6 sections of information:
  1. Client name + Week X OF 30
  2. Status (ON_TIME, DELAYED, etc.) with color
  3. Leaderboard Rank (X of Y)
  4. On-Time Delivery (fraction + percentage)
  5. Quality Integration (percentage + target)
  6. Current Sprint details + Next Sprint preview
- ✅ Numbers are large and easy to read
- ✅ If the client has 6+ sprints, you see "↑ improving" or "↓ declining" under Quality Integration

**IF YOU DON'T SEE THIS:**
- ❌ Executive Summary not redesigned correctly
- Report: What's wrong specifically (colors, missing metrics, layout, etc.)

---

## ✅ TEST 8: Check Mobile Layout

### **Goal:** Verify mobile view is simplified

**Steps:**
1. On the client dashboard with leaderboard visible
2. Either:
   - Open on an actual mobile phone, OR
   - Resize your browser window to be very narrow (< 768px wide), OR
   - Open Developer Tools (F12) and click the mobile device icon
3. Look at the leaderboard

**EXPECTED RESULT:**
- ✅ Desktop table is HIDDEN
- ✅ You see CARDS instead of a table
- ✅ Each card shows:
  1. Rank number (large) + Team name
  2. Status badge (top-right corner)
  3. Combined Score (in a centered card)
  4. "VIEW DETAILS" button ONLY for the current client
- ✅ It's easy to read and scroll
- ✅ No horizontal scrolling required

**IF YOU DON'T SEE THIS:**
- ❌ Mobile layout not implemented correctly
- Report: "Mobile view still shows full table" or "Cards don't appear"

---

## ✅ TEST 9: Test Graduation (Sprint 30)

### **Goal:** Verify auto-graduation when completing sprint 30

**Steps:**
1. Find a client who has completed 29 sprints (or create a test scenario)
2. Use the Score Calculator to enter sprint **30**
3. Fill in quality score and dates
4. Submit
5. Check the client's status

**EXPECTED RESULT:**
- ✅ Submission succeeds
- ✅ Client's status automatically changes to "GRADUATED"
- ✅ Graduation date is set to today
- ✅ You see this reflected in the client's card or details

**IF YOU DON'T SEE THIS:**
- ❌ Auto-graduation not working
- Report: "Client didn't auto-graduate after completing sprint 30"

---

## ✅ TEST 10: Check for Yellow Colors

### **Goal:** Verify NO yellow/amber colors exist anywhere

**Steps:**
1. Visit both Associate Dashboard and Client Dashboard
2. Look at ALL components:
   - Status badges
   - Buttons
   - Leaderboard rows
   - Executive Summary
   - Cards
   - Modals
3. Look for ANY yellow, orange-yellow, or amber colors

**EXPECTED RESULT:**
- ✅ You see NO yellow or amber colors anywhere
- ✅ Colors you see are:
  - Black/dark gray (backgrounds)
  - White (text, buttons)
  - RED (#E50914) - alerts, current client border
  - GREEN (#1DB954) - success, good metrics
  - GRAY (#999999) - neutral states
- ✅ NO exceptions

**IF YOU SEE YELLOW:**
- ❌ Some components weren't updated
- Report: "Found yellow color in [specific component/location]"

---

## 📊 TESTING SUMMARY FORM

After completing all tests, fill this out:

```
=== FAST TRACK LEADERBOARD TESTING RESULTS ===

Test 1 - Score Calculator Visible:        [ ] PASS  [ ] FAIL
Test 2 - Client Dropdown Works:           [ ] PASS  [ ] FAIL
Test 3 - Live Preview Updates:            [ ] PASS  [ ] FAIL
Test 4 - Score Submission Works:          [ ] PASS  [ ] FAIL
Test 5 - Duplicate Detection:             [ ] PASS  [ ] FAIL
Test 6 - Rank Changes & Arrows:           [ ] PASS  [ ] FAIL
Test 7 - Executive Summary:               [ ] PASS  [ ] FAIL
Test 8 - Mobile Layout:                   [ ] PASS  [ ] FAIL
Test 9 - Auto-Graduation:                 [ ] PASS  [ ] FAIL
Test 10 - No Yellow Colors:               [ ] PASS  [ ] FAIL

OVERALL STATUS: ___ out of 10 tests passed

ISSUES FOUND:
1. _______________________________________
2. _______________________________________
3. _______________________________________

NOTES:
_________________________________________
_________________________________________
```

---

## 🆘 TROUBLESHOOTING

### **"I can't log in"**
- Make sure you're using a valid access code (ELENA001, CFL2025, etc.)
- Check that the database is connected (look for error messages)

### **"The page is blank"**
- Open browser Developer Tools (F12)
- Look at the Console tab
- Share any red error messages you see

### **"Nothing happens when I click submit"**
- Check your internet connection
- Make sure the database (Supabase) is running
- Look for error messages in the preview panel

### **"I see an error message"**
- Read the error carefully - it usually tells you what's wrong
- Share the exact error message for help

### **"The layout looks broken"**
- Try refreshing the page (Ctrl+R or Cmd+R)
- Try a different browser
- Make sure you're on the latest code version

---

## ✅ WHAT TO REPORT

If any test fails, provide:
1. **Test number and name** (e.g., "Test 4 - Score Submission")
2. **What you expected to see**
3. **What you actually saw**
4. **Any error messages** (copy exact text)
5. **Screenshots** if possible

---

## 🎉 SUCCESS CRITERIA

The system is **READY FOR PRODUCTION** if:
- ✅ All 10 tests PASS
- ✅ No critical errors found
- ✅ Performance is acceptable (no long waits)
- ✅ Mobile layout works smoothly

---

**Good luck with testing!** 🚀

If you have questions or need help interpreting results, refer to the SELF_AUDIT_REPORT.md for technical details.


