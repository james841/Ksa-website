import { ActionButton } from "./forms";
import { Panel } from "./ui";
import { ROLE_INFO, type Section, type StaffRole } from "@/lib/auth/permissions";
import { setMyAlerts } from "@/app/actions/admin/team";
import { Mail } from "@/components/ui/icons";

/*
 * What this person is emailed about, and a switch to stop it.
 * The list comes from their role, so it always matches what they can open.
 */
const WATCHED: Partial<Record<Section, string>> = {
  quotes: "New service requests",
  users: "New accounts",
  subscribers: "New email subscribers",
  webinars: "New webinar registrations",
  courses: "New enrolments and course interest",
  campaigns: "Campaign results",
  team: "Team and role changes",
};

export function AlertsCard({ staffRole, on, generalEmail }: { staffRole: StaffRole; on: boolean; generalEmail: string }) {
  const mine = ROLE_INFO[staffRole].sections.map((s) => WATCHED[s]).filter(Boolean) as string[];

  return (
    <Panel
      title="Email alerts"
      description={on ? "Sent to you as things happen, for your part of the console only." : "Turned off. You will not be emailed when something happens."}
      actions={
        <ActionButton
          action={setMyAlerts}
          hidden={{ on: on ? "0" : "1" }}
          variant={on ? "ghost" : "dark"}
          success={on ? "Email alerts turned off" : "Email alerts turned on"}
        >
          {on ? "Turn off" : "Turn on"}
        </ActionButton>
      }
    >
      <div className="flex items-start gap-3">
        <span className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-full ${on ? "bg-blue-50 text-blue" : "bg-mist text-muted"}`}>
          <Mail size={18} />
        </span>
        <div className="min-w-0">
          {mine.length ? (
            <ul className="flex flex-wrap gap-1.5">
              {mine.map((label) => (
                <li key={label} className={`rounded-full px-2.5 py-1 text-xs font-medium ${on ? "bg-mist text-ink" : "bg-mist text-muted line-through"}`}>
                  {label}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Your role has no alerts attached to it.</p>
          )}
          <p className="mt-3 text-xs text-muted">
            {generalEmail
              ? `Everything is also copied to ${generalEmail}, so nothing is missed when people are away.`
              : "No general alerts address is set yet. Add one in Site settings so nothing is missed."}
          </p>
        </div>
      </div>
    </Panel>
  );
}
