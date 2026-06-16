import { ColumnType, Generated, Insertable, Selectable, Updateable } from 'kysely';

export interface Database {
  users: UserTable;
  profiles: ProfileTable;
}

export interface UserTable {
  id: Generated<string>;
  email: string;
  password_hash: string;
  role: Generated<string>;
  is_banned: Generated<boolean>;
  created_at: Generated<Date>;
}

export type User = Selectable<UserTable>;
export type NewUser = Insertable<UserTable>;
export type UserUpdate = Updateable<UserTable>;

export interface ProfileTable {
  id: Generated<string>;
  user_id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  tier_level: Generated<string>;
  experience_points: Generated<number>;
  updated_at: Generated<Date>;
}

export type Profile = Selectable<ProfileTable>;
export type NewProfile = Insertable<ProfileTable>;
export type ProfileUpdate = Updateable<ProfileTable>;
