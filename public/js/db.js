;(() => {
  const form = document.querySelector("form.add-recipe");
  const recipes = document.querySelector(".recipes");

  db.enablePersistence().catch(err => {
    switch (err.code) {
      case "failed-precondition": {
        // probably multiple tabs open at once
        console.log("persistence failed");
        break;
      }

      case "unimplemented": {
        // lack of browser support
        console.log("persistence is not available");
        break;
      }

      default: {
        break;
      }
    }
  });

  db.collection("recipes").onSnapshot(snapshot => {
    snapshot.docChanges().forEach(change => {
      // console.log(change, change.doc.data(), change.doc.id);

      switch (change.type) {
        case "added": {
          // add the document data to the web page
          renderRecipe(change.doc.data(), change.doc.id);
          break;
        }
        case "removed": {
          // remove the document data to the web page
          removeRecipe(change.doc.id);
          break;
        }
        default: {
          break;
        }
      }
    });
  });

  form.addEventListener("submit", evt => {
    evt.preventDefault();

    db.collection("recipes")
      .add({
        title: form.title.value,
        ingredients: form.ingredients.value
      })
      .catch(console.error);

    form.title.value = "";
    form.ingredients.value = "";
  });

  recipes.addEventListener("click", evt => {
    if (
      evt.target.tagName === "I" &&
      evt.target.textContent.includes("delete")
    ) {
      const { id } = evt.target.dataset;

      db.collection("recipes")
        .doc(id)
        .delete();
    }
  });
})();
