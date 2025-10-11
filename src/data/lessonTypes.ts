export type Teacher = {
    id: string;
    name: string;
    email: string;
};

export type Slot = {
    start: string;
    duration: number;
};

export type LessonType = {
    id: string;
    name: string;
    iconId: string;
    color: string;
};

export type Lesson = {
    lessonId: string;
    teacherId: string;
    paused: boolean;
};

export type Day = {
    name: string;
    lessons: Lesson[];
};

export type LessonsPlan = {
    teachers: Teacher[];
    slots: Slot[];
    lessonTypes: LessonType[];
    days: Day[];
};