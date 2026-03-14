import { InMemoryDatabase } from '../db/db';
import { DispatchResult, NotificationPayload } from '../types';
export declare class NotificationService {
    private readonly db;
    constructor(db: InMemoryDatabase);
    private sendToChannel;
    dispatch(payload: NotificationPayload): Promise<DispatchResult[]>;
    notifyJobEvent(payload: NotificationPayload): Promise<DispatchResult[]>;
}
