# User Flows

## Onboarding flow

1) Users authenticate with a public key. We support metamask and magic.link. There is only login no signup therefore.

2) When you are logged out let's have the header show a login button - that will go to a login. i want login to be modals - not pages.

3) When you are logging in or signing up, after authentication, but prior to leaving the login up modal - we should try to collect a unique slug name for you (this will be used to create an entity of type party that is your home entity), but if we notice that you already have an existing account then we should just direct you to that instead. if you cancel signing up after authentication, but before having an associated entity party, then we should treat that as not signed in - basically being signed in means both being authenticated and having an associated entity party id. on a successful sign up send the user to /profile. the mechanic for creating an entity party at this time should be custom, let's not use the normal entity form - since we only have one field to worry about (your slug for your entity party).

4) public profile entity view - It is important to understand that a user has one or more entity type party identity objects that represent themselves and that are the canonical idea of that 'user'. Most social networks keep users in a separate table, but we treat users as just another entity like any other artifact in the system, and that entity can be viewed - it will provide a default public view similar to viewing any other object. So we will want a public view of a party that is fairly simple for now.

5) Private profile - On login we throw the users to a reserved private user profile page - let's put this at /profile or ?path=profile depending on our router style config. This private profile area actually does a few onboardy type chores for new users as well - so it can be helpful for that first time experience as well as providing a personal analytics and favorites view of your own experience.

6) On the private /profile page we should show a list of their recent posts (on this new private user profile page). We may even want a table here showing analytics and activity on a given post, how many people viewed it and engagement and so on. We may even want general analytics such as total number of posts created, total responses - some of this data we don't have yet but it would be nice to stub out something that feels like a rich set of analytics. I think we can at least show their recent posts - and again I'd like all of these kinds of queries to be in a shared common api on the client side just so that we abstract away low level operations and consolidate the kinds of high level queries we want to do.

7) On your private /profile We should have a section or component for basic settings, such as allow location on map, light dark mode, imperial metric coordinates.
