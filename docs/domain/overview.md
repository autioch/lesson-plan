# Domain — Lesson Planning

The product's vision, glossary, and user scenarios.

## Vision

**Lesson Plan** is a tool for school staff to view and manage the weekly class timetable. Teachers
see which classes they teach, when, and where. Administrators see the full school schedule and can
spot conflicts or gaps. The schedule is built once per term and published to staff and students.

## Glossary

| Term            | Definition                                                                                                       |
| --------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Lesson**      | A scheduled meeting between a teacher, a class, and a room for a fixed duration.                                 |
| **Teacher**     | A staff member who teaches one or more classes.                                                                  |
| **Class**       | A group of students (e.g., "10a", "Year 10"). A class attends many lessons per week.                             |
| **Room**        | A location where a lesson happens (e.g., "Lab 1", "Gym").                                                        |
| **Slot**        | A named time block (e.g., "09:05–09:50", "Lesson 3"). The site displays all lessons in a grid of slots and days. |
| **Lesson type** | A category (e.g., "Education", "Exam", "Special"). Used for visual distinction and filtering.                    |
| **Timetable**   | The full weekly schedule; one timetable per term.                                                                |

## Scenarios

### S1: View the weekly schedule (teacher)

**User:** Teacher MSkrzypczak  
**Goal:** Check what classes I teach this week and when.  
**Flow:**

1. Open the timetable.
2. Find my name in the "Teacher" column.
3. Read the day, time, room, and class for each of my lessons.

**Expected:** My lessons are listed and grouped by day or time. I can see all my teaching slots for
the week in under 10 seconds.

### S2: View a specific class schedule

**User:** Student or parent  
**Goal:** Find out when class 10a has lessons.  
**Flow:**

1. Open the timetable.
2. Scan the "Class" column for "10a".
3. Read the day, time, teacher, and room for each of 10a's lessons.

**Expected:** All lessons for class 10a are listed. I can answer "When does 10a have Math?" or
"Who teaches PE to 10a on Monday?"

### S3: Check a room's availability

**User:** Administrator or substitute teacher  
**Goal:** Find an empty room at a specific time.  
**Flow:**

1. Open the timetable.
2. Look at a specific day and time slot (e.g., Monday, 10:00).
3. Check which rooms are free.

**Expected:** I can see which lessons are scheduled in each room; I can infer which rooms are empty.

### S4: Print the timetable

**User:** Administrator  
**Goal:** Print a copy of the weekly schedule to post on the staff board.  
**Flow:**

1. Open the timetable.
2. Print the page (Ctrl+P or browser menu).
3. Confirm the printed output is legible and complete.

**Expected:** The printed page shows all lessons, is easy to read, and fits on standard paper
(landscape recommended).

## Product constraints

- **Data is static.** The timetable is built and published once per week or term; teachers and
  students view it read-only. No live editing.
- **One timetable at a time.** The site shows the current week's or term's schedule, not an archive
  or a future term.
- **Polish, not feature creep.** Focus on presenting the timetable clearly; say no to filters,
  export formats, or search until the core view is perfect.
