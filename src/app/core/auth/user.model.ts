export class User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  token: string;
  admin: number;
  trails: unknown[];


  constructor(
    id: string,
    name: string,
    email: string,
    avatar: string,
    token: string,
    admin: number,
    trails: unknown[]
  ) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.avatar = avatar;
    this.token = token;
    this.admin = admin;
    this.trails = trails;
  }
}
