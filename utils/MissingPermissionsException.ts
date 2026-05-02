export class MissingPermissionsException {
  public message = "Missing permissions:";
  public permissions: string[];

  constructor(permissions: string[]) {
    this.permissions = permissions;
  }

  public toString() {
    return `${this.message} ${this.permissions.join(", ")}`;
  }
}
