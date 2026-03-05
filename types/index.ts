export type DisciplineType =
  | "police"
  | "fire"
  | "ems"
  | "dispatch"
  | "dpw"
  | "fbi"
  | "dhs"
  | "corrections"
  | "other";

export interface Agency {
  id: string;
  name: string;
  slug: string;
  discipline: DisciplineType;
  city: string;
  state: string;
  state_abbr: string;
  county?: string;
  website?: string;
  employee_count?: number;
  verified: boolean;
  created_at: string;
  // computed
  avg_overall?: number;
  review_count?: number;
  open_job_count?: number;
}

export interface Review {
  id: string;
  agency_id: string;
  user_id: string;
  anonymous_alias: string;
  title: string;
  body: string;
  pros: string;
  cons: string;
  rating_overall: number;
  rating_culture: number;
  rating_leadership: number;
  rating_worklife: number;
  rating_pay: number;
  rating_equipment: number;
  rating_advancement: number;
  rating_family: number;
  employment_status: "active" | "former" | "volunteer";
  years_experience?: number;
  recommend: boolean;
  upvotes: number;
  created_at: string;
}

export interface Thread {
  id: string;
  agency_id?: string;
  user_id: string;
  anonymous_alias: string;
  title: string;
  body: string;
  category: ThreadCategory;
  discipline_filter?: DisciplineType;
  upvotes: number;
  comment_count: number;
  pinned: boolean;
  created_at: string;
}

export type ThreadCategory =
  | "general"
  | "salary"
  | "culture"
  | "equipment"
  | "training"
  | "mental_health"
  | "family_life"
  | "news"
  | "advice";

export interface Comment {
  id: string;
  thread_id: string;
  user_id: string;
  anonymous_alias: string;
  body: string;
  parent_id?: string;
  upvotes: number;
  created_at: string;
}

export interface Job {
  id: string;
  agency_id: string;
  agency?: Agency;
  posted_by_user_id: string;
  title: string;
  description: string;
  requirements: string;
  discipline: DisciplineType;
  employment_type: "full_time" | "part_time" | "volunteer" | "per_diem";
  salary_min?: number;
  salary_max?: number;
  salary_type: "hourly" | "annual";
  benefits?: string;
  external_apply_url?: string;
  deadline?: string;
  active: boolean;
  created_at: string;
}

export interface UserProfile {
  id: string;
  anonymous_alias: string;
  discipline?: DisciplineType;
  agency_id?: string;
  is_department_rep: boolean;
  created_at: string;
}

export type SortOption = "recent" | "top" | "most_reviewed";
