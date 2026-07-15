import { ROLE_LABELS, type RoleTag } from "../domain/types";

const CLS: Record<RoleTag, string> = {
  MOC: "moc",
  CHAMP: "champ",
  GRAND_ROBIN: "grand",
  ANGLER: "",
  JAFNG: "jafng",
  INACTIVE: "",
};

export function RoleBadge({ role }: { role: RoleTag }) {
  return <span className={`tag ${CLS[role]}`}>{ROLE_LABELS[role]}</span>;
}
