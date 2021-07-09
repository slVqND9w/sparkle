import React from "react";
import { Route, Switch } from "react-router-dom";

import Admin from "pages/Admin/Admin";
import { RoomsForm } from "pages/Admin/Venue/Rooms/RoomsForm";
import { VenueWizard } from "pages/Admin/Venue/VenueWizard";

import Admin_v2 from "pages/Admin/Admin_v2";
import VenueWizard_v2 from "pages/Admin/Venue/VenueWizard/VenueWizard";
import { AdminAdvancedSettings } from "pages/AdminAdvancedSettings";
import VenueUsers from "pages/Admin/Venue/Users/VenueUsers";
import { AdminVenueView } from "components/organisms/AdminVenueView";

export const AdminSubrouter: React.FC = () => {
  return (
    <Switch>
      {/* Admin V1 */}
      <Route path="/admin/venue/rooms/:venueId" component={RoomsForm} />
      <Route path="/admin/venue/creation" component={VenueWizard} />
      <Route path="/admin/venue/edit/:venueId" component={VenueWizard} />
      <Route path="/admin/venue/usersdata/:venueId" component={VenueUsers} />
      <Route path="/admin/:venueId" component={Admin} />
      <Route path="/admin" component={Admin} />

      {/* Admin V2/3/NG */}
      <Route path="/admin-ng/venue/:venueId?" component={AdminVenueView} />
      <Route
        path="/admin-ng/advanced-settings/:venueId?"
        component={AdminAdvancedSettings}
      />
      <Route path="/admin-ng/venue/creation" component={VenueWizard_v2} />
      <Route path="/admin-ng/edit/:venueId" component={VenueWizard_v2} />
      <Route path="/admin-ng" component={Admin_v2} />
    </Switch>
  );
};
