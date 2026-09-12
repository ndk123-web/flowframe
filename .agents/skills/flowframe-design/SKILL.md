# FlowFrame — Complete UI/UX Redesign Brief

You are working on FlowFrame, an interactive distributed-systems simulator.

The current functionality is already working. The goal of this task is to redesign the product UI/UX and visual system so it feels like a polished professional developer/engineering product.

IMPORTANT:
This is primarily a UI/UX redesign.

DO NOT rewrite, refactor, or alter working application logic unless absolutely required for the UI changes.

Especially DO NOT modify the existing React Flow architecture, request execution, simulation, animation, node behavior, or edge behavior.

The current request/simulation behavior is working correctly and must remain exactly as it is.

==================================================
1. GLOBAL VISUAL RULE — NO EMOJIS
==================================================

Remove emojis from the entire application.

Do not use emojis in:

- navigation
- buttons
- cards
- dashboard
- workspace
- canvas
- scenarios
- learn pages
- glossary
- documentation
- AI interface
- notifications
- empty states
- login/signup
- footer

Use professional icons instead.

Use the existing icon library in the project wherever possible.

Icons should be:

- simple
- consistent
- functional
- appropriately sized

Do not replace emojis with decorative icons everywhere unnecessarily.

==================================================
2. OVERALL DESIGN LANGUAGE
==================================================

FlowFrame should feel like a serious developer/engineering tool.

Reference the design philosophy of products such as:

- VS Code
- Eraser
- Canva
- ChatGPT
- modern developer IDEs

Do NOT copy their exact UI.

Take inspiration from their:

- layout structure
- spacing
- hierarchy
- navigation
- panels
- toolbars
- typography
- interaction patterns

Avoid the generic "AI-generated SaaS" appearance.

Avoid:

- excessive gradients
- neon colors
- excessive glow
- glassmorphism
- floating decorative blobs
- decorative particles
- unnecessary animations
- excessive rounded cards
- giant headings
- excessive shadows
- excessive pills
- excessive badges

Use a restrained visual system.

The interface should look intentionally designed, not generated.

==================================================
3. HOME PAGE
==================================================

Redesign the homepage so the product is immediately understandable.

Keep the tagline short.

The messaging should communicate the core product:

"Build, run, and understand distributed systems."

Keep the page structured and product-focused.

Do not make the homepage look like a generic AI startup landing page.

Use clear sections for:

- what FlowFrame is
- how it works
- key capabilities
- scenarios/templates
- learning resources
- CTA to start building

Keep visual hierarchy strong and avoid unnecessary decoration.

==================================================
4. DASHBOARD
==================================================

The dashboard should feel similar in structure to professional products such as Canva or ChatGPT.

The dashboard should immediately communicate what the user can do.

The main dashboard should contain:

- primary action to create/build an architecture
- AI prompt / architecture creation entry point
- architecture templates
- recent workspaces
- recent diagrams
- quick access to scenarios
- useful learning entry points

The dashboard should not simply be a collection of cards.

Create a clear hierarchy.

Example conceptual structure:

SIDEBAR
    Workspaces
    Recent diagrams
    Scenarios
    Learn
    Glossary
    Docs

MAIN AREA
    Create architecture / AI prompt
    Templates
    Recent work
    Explore scenarios

The exact implementation should fit the existing application.

==================================================
5. SIDEBAR
==================================================

The sidebar should feel like a professional application sidebar.

Use a collapsible vertical sidebar inspired by tools such as Eraser and developer IDEs.

COLLAPSED STATE:

Show only icons.

For example:

[icon]
[icon]
[icon]
[icon]
[icon]

EXPANDED STATE:

Show:

[icon] Workspace
[icon] Scenarios
[icon] Learn
[icon] Glossary
[icon] Docs

The sidebar should smoothly expand/collapse.

Do not make it permanently consume a large portion of the screen.

The canvas should receive maximum available space.

==================================================
6. SIDEBAR CONTENT
==================================================

The sidebar should contain the important product navigation.

Include appropriate sections for:

- Workspaces
- Recent workspaces
- Diagrams
- Scenarios
- Learn
- Glossary
- Docs

Recent workspaces/diagrams should be visually organized rather than displayed as a huge list.

Keep navigation compact.

==================================================
7. USER PROFILE
==================================================

At the bottom of the sidebar, place the user profile area.

Follow the interaction pattern of professional products such as Canva.

Example:

[avatar] User

Clicking it should open a small menu with appropriate account actions.

Do not keep the user's full name unnecessarily visible in the main header.

The profile/account area should be the main place for:

- profile
- settings
- personalization
- account preferences
- logout

Create/use a dedicated Settings/Profile page where appropriate.

==================================================
8. HEADER
==================================================

Redesign the header to feel professional and product-oriented.

The header should be minimal.

Do not overload it with:

- user name
- unnecessary badges
- excessive buttons
- decorative AI elements

Keep only useful actions.

Use proper icon buttons with tooltips where appropriate.

==================================================
9. FOOTER
==================================================

Redesign the footer consistently with the new visual system.

Keep it minimal and professional.

Do not use decorative elements.

Ensure typography, spacing, links, and alignment feel intentional.

==================================================
10. LOGIN / SIGNUP
==================================================

Redesign login and signup using the same professional design language.

The authentication pages should feel polished and consistent with the canvas/application.

Avoid generic AI landing-page authentication designs.

Keep the forms clean.

Use:

- clear typography
- proper spacing
- subtle borders
- professional inputs
- consistent buttons
- proper validation/error states

==================================================
11. CANVAS
==================================================

The canvas is the CORE PRODUCT.

It should feel like a professional technical diagramming/simulation environment.

Reference the visual philosophy of Eraser and developer tools.

The canvas should prioritize:

Architecture
    ↓
Connections
    ↓
Request flow
    ↓
Simulation

The canvas should dominate the screen.

Use:

- clean background
- subtle grid
- professional node styling
- thin connections
- clear hierarchy
- generous whitespace

Remove:

- emojis
- glowing dots
- continuously pulsing dots
- decorative particles
- unnecessary animations
- neon effects
- excessive gradients

==================================================
12. CANVAS NODES
==================================================

Redesign nodes to look like actual engineering components.

Nodes should be:

- compact
- rectangular
- structured
- readable
- consistent

Use simple professional icons.

Example:

[icon] API Gateway
       api-gateway

Avoid making every node look like a colorful SaaS card.

Do not add decorative status elements unless they communicate real simulation state.

==================================================
13. CANVAS SIDEBAR / TOOL PANEL
==================================================

The existing canvas tool sidebar is too visually compressed.

Redesign it as a proper vertical collapsible toolbar.

COLLAPSED:

Only icons are visible.

EXPANDED:

Icon + name are visible.

Example:

[icon] Select
[icon] Components
[icon] Connections
[icon] Settings

The interaction should feel similar to a professional engineering/diagramming tool.

Do not permanently show every setting.

Use contextual panels and buttons instead.

==================================================
14. CANVAS SETTINGS
==================================================

Do not put every setting directly onto the canvas.

Keep the canvas visually clean.

For example:

[Settings]

Clicking Settings can open a menu/panel containing:

- Grid
- Snap
- Zoom behavior
- Canvas preferences
- other existing canvas settings

Grid controls should NOT permanently occupy prominent space at the top.

==================================================
15. NODE INSPECTOR
==================================================

When a node is selected, its configuration should open as a proper RIGHT-SIDE INSPECTOR PANEL.

Do not display the configuration as a floating card "in the air".

Conceptually:

+--------------------------------------+----------------------+
|                                      | Node Inspector       |
|                                      |                      |
|          ARCHITECTURE CANVAS         | API Gateway          |
|                                      |                      |
|                                      | Properties           |
|                                      | Configuration        |
|                                      | Connections          |
|                                      |                      |
+--------------------------------------+----------------------+

The panel should be attached to the right edge of the application.

Use a clear divider between canvas and inspector.

It should feel like a native part of the application.

The canvas should resize naturally when the inspector opens.

==================================================
16. AI ASSISTANT IN CANVAS
==================================================

The AI assistant should feel like an engineering agent integrated into the developer tool.

Do NOT make it look like a generic ChatGPT clone.

Do NOT use:

- sparkle icons
- giant AI branding
- glowing AI cards
- excessive gradients
- oversized chat UI

Use a simple professional label such as:

Architecture Assistant

The assistant can provide actions such as:

- Plan architecture
- Create architecture
- Modify architecture
- Fix architecture
- Explain architecture
- Explain simulation

Think more like an IDE coding agent / architecture agent than a chatbot.

The AI should operate contextually on the current architecture.

==================================================
17. REQUEST / SIMULATION UI
==================================================

DO NOT CHANGE THE EXISTING REQUEST EXECUTION OR SIMULATION LOGIC.

The current request flow is already functional.

Do not modify:

- React Flow logic
- request traversal
- node execution
- edge execution
- timing
- animation engine
- simulation state
- API behavior

ONLY redesign how the existing functionality is visually presented.

The current request controls should remain usable.

Keep the existing:

- request input
- Run
- Pause
- Step
- Reset
- API/request selection

but make them visually compact and professional.

==================================================
18. SIMULATION RESULT
==================================================

After the architecture is successfully compiled/validated, show a professional status notification.

For example:

Architecture compiled successfully.

You can now run the simulation.

This can appear as a small toast/status message.

It should not be a large modal.

It should appear at the appropriate moment rather than repeatedly.

==================================================
19. WELCOME TO FLOWFRAME SANDBOX
==================================================

The "Welcome to FlowFrame Sandbox" template popup should NOT appear every time.

Show it only for the user's first visit.

Use localStorage or the existing application persistence mechanism.

Conceptually:

First visit:
    Show popup
    ↓
User closes/continues
    ↓
Save "sandboxWelcomeSeen"
    ↓
Future visits:
    Do not show popup

Do not change the underlying sandbox functionality.

==================================================
20. LEARN / SCENARIOS / GLOSSARY / DOCS
==================================================

These pages also need the same design language.

Do not redesign them as generic AI SaaS pages.

Make them feel like parts of the same technical product.

### Scenarios

Clearly show:

- scenario name
- difficulty
- architecture
- objective
- what the user will learn
- start simulation/build action

### Learn

Organize learning content clearly.

Avoid huge decorative cards.

Use a clean knowledge-product layout.

### Glossary

Make glossary searchable and easy to scan.

### Docs

Use a technical documentation layout with:

- sidebar navigation
- readable content
- code blocks
- clear headings
- proper spacing

All pages must share the same design system.

==================================================
21. DESIGN SYSTEM
==================================================

Create a consistent design system across the entire application.

Define consistent:

- typography
- font sizes
- font weights
- spacing
- border radius
- borders
- shadows
- icons
- buttons
- inputs
- panels
- navigation
- status indicators

Do not introduce a different design style on every page.

FlowFrame should look like ONE product.

==================================================
22. RESPONSIVE DESIGN
==================================================

Desktop is the primary experience.

Still ensure the UI works properly on:

- desktop
- tablet
- mobile

On smaller screens:

- sidebar becomes a drawer
- inspector becomes a drawer
- AI becomes a drawer
- logs become a bottom sheet/drawer
- canvas remains usable

Do not simply shrink the desktop UI.

==================================================
23. VISUAL REVIEW
==================================================

After implementing the redesign, inspect all major states.

Check:

Dashboard
Workspace
Canvas
Scenarios
Learn
Glossary
Docs
Login
Signup
Settings
Footer
Sidebar

For the canvas specifically test:

1. Empty canvas
2. Architecture created
3. Node selected
4. Inspector open
5. Simulation idle
6. Simulation running
7. Simulation paused
8. Simulation completed
9. Simulation error
10. Logs open
11. AI assistant open
12. Sidebar collapsed
13. Sidebar expanded

Fix visual inconsistencies discovered during review.

==================================================
24. FINAL DESIGN PRINCIPLE
==================================================

The final product should communicate:

"FlowFrame is a serious developer tool for building, exploring and understanding distributed systems."

NOT:

"FlowFrame is an AI SaaS dashboard with a diagram."

The architecture and simulation are the product.

AI is a capability.

The UI should support the architecture instead of competing with it.

Before finishing, remove anything that looks decorative, excessive, unnecessary or AI-generated.