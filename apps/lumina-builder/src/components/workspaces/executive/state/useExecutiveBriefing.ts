import { useEffect } from "react";

import { composeExecutiveBriefing, type ExecutiveBriefing } from "./executiveBriefing";
import {
  previousExecutiveOfficeVisit,
  recordExecutiveOfficeVisit,
  useExecutiveOffice,
} from "./useExecutiveOffice";

let visitRecorded = false;

export function useExecutiveBriefing(): ExecutiveBriefing {
  const office = useExecutiveOffice();
  const briefing = composeExecutiveBriefing(office, previousExecutiveOfficeVisit);

  useEffect(() => {
    if (briefing.ready && !visitRecorded) {
      visitRecorded = true;
      recordExecutiveOfficeVisit();
    }
  }, [briefing.ready]);

  return briefing;
}
