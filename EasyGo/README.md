
### Known Issues & Bugs

These are issues we are actively working to resolve or features that are not yet fully functional:

1.  **Public Transport Distance Inaccuracy:**
    * The `public transport` distance metric currently only returns the **walking distance** component. It needs to be updated to reflect the full journey distance (including bus/train travel).
2.  **Convenience Score Transparency:**
    * The calculation and display of the **Convenience Score** needs to be made more transparent to the user, particularly concerning how the user-defined filter weights influence the final score.
3.  **Map Overlays and Popups:**
    * **Driving Route Overlap:** Driving routes are, by design, often visually close together (as they primarily differ by the assigned carpark). This causes their route popups on the map to **stack and overlap**
4.  **Driving Route Card Information:**
    * The **Driving Route Card** needs enhancement to explicitly include the **assigned carpark details** (name, distance, etc.).
    * We also need to implement functionality to **display or highlight the chosen carpark** on the map when a driving route is selected.
5.  **Certain start, end locations issues**

    *Locations Known to work:
    Yew Tee MRT Station > Harbourfront MRT Station
    Compass One > Serangoon Nex

    *Fail
    Chua Chu Kang Hindu Cemetry > The Japanese Cemetry Park

    * Some areas will fail to generate routes if bus data is unable to generate (critical)
    * either through bus timing / other reasons. will need to handle such empty edge casesxz.
---

### Work In Progress (WIP)

1.  **User Authentication:**
    * Implementing **Login/Signup** functionality.
    * Enabling users to **save and retrieve preferred routes**.
2.  **Map Integration for Public Transport:**
    * Developing a **custom popup for public transport routes** on the map =
3.  **Route Calculation Logic Refactor (Optimization):**
    * Refactoring the `getRoute` logic to optimize performance. The plan is to **only calculate the Convenience Score on saved or selected routes**, rather than re-calculating all possible scores every time the initial routes are fetched.


.env.local is setup temporarily for convenience
```
## Getting Started

Firstly

```bash
npm install
```

Secondly, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/do 


