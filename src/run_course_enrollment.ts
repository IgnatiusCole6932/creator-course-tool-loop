const response = await fetch("http://localhost:3000/enrollments/complete", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    requestId: "enrollment-algebra-1042",
    subscriberEmail: "learner@example.com",
    subscriberName: "Mina",
    courseTitle: "Practical Algebra",
    assetSlug: "factoring-practice-pack.pdf",
    lessonNotes: "The learner completed the factoring lesson and should practice the difference-of-squares examples next.",
  }),
});

console.log(await response.json());
