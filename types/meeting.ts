export interface MeetingFormData {
  title:          string;
  date:           string;
  attendees:      string;
  attendeeEmails: string;
  notes:          string;
  tone:           string;
  mode:           "ai" | "manual";
  attachmentNames: string[];
}

export interface Summary {
  executiveSummary: string;
  decisions:        string[];
  actionItems:      string[];
  nextSteps:        string[];
  gist:             string;
}

export interface MeetingMeta {
  title:     string;
  date:      string;
  attendees: string;
}

export interface SummarizeResult {
  summary: Summary;
  id:      string | null;
}
