export interface ISchedule {
    id: number;
    documentId: string;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
    date: string;
    slots: number;
}

export interface IScheduleResponse {
    schedule_id: number;
    time: string;
}