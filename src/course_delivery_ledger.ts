export type CourseEnrollment = {
  requestId: string;
  subscriberEmail: string;
  subscriberName: string;
  courseTitle: string;
  assetSlug: string;
  lessonNotes: string;
};

export type DeliveryResult = {
  requestId: string;
  downloadUrl: string;
  assetSlug: string;
};

export type SubscriberUpdate = {
  requestId: string;
  subscriberEmail: string;
  subject: string;
  message: string;
  downloadUrl: string;
};

export class CourseDeliveryLedger {
  readonly deliveries = new Map<string, DeliveryResult>();
  readonly updates = new Map<string, SubscriberUpdate>();

  deliverAsset(enrollment: CourseEnrollment): DeliveryResult {
    const existing = this.deliveries.get(enrollment.requestId);
    if (existing) return existing;

    const result = {
      requestId: enrollment.requestId,
      assetSlug: enrollment.assetSlug,
      downloadUrl: `https://downloads.example.edu/${encodeURIComponent(enrollment.requestId)}/${encodeURIComponent(enrollment.assetSlug)}`,
    };
    this.deliveries.set(enrollment.requestId, result);
    return result;
  }

  updateSubscriber(input: Omit<SubscriberUpdate, "downloadUrl">): SubscriberUpdate {
    const existing = this.updates.get(input.requestId);
    if (existing) return existing;

    const delivery = this.deliveries.get(input.requestId);
    if (!delivery) {
      throw new Error("Complete the course asset delivery before sending the subscriber update.");
    }

    const result = { ...input, downloadUrl: delivery.downloadUrl };
    this.updates.set(input.requestId, result);
    return result;
  }
}
