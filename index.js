document.getElementById("login-btn").addEventListener("click", () => {
  import("./auth.js").then(({ signInWithGoogle }) => signInWithGoogle());
});
