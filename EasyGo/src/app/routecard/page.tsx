"use client"

import { useEffect } from "react";

export default function Page() {

  useEffect(() => {
    async function test() {
      const response = await fetch('/api/test-convenience', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          start: [1.397055, 103.747498], 
          end: [1.2654, 103.8203],
          filterData: {
            durationWeight: 1,
            walkingDistanceWeight: 1,
            noTransferWeight: 1,
            carparkAvailabilityWeight: 1,
            busWaitTimeWeight: 1,
            platformDensityWeight: 1,
            fareWeight: 1,
          }
        })
      })
      const data = await response.json();
      console.log(data);
    }

    test()
  }, []);

  return (
    <>
    </>
  )
}
