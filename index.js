const http = require("http");
const fs = require("fs");
const path = require("path");
const querystring = require("querystring");

const portArgument = process.argv.find((argument) =>
  argument.startsWith("--port="),
);

const port = portArgument ? Number(portArgument.split("=")[1]) : 3000;

const pages = {
  "/": "home.html",
  "/project": "project.html",
  "/registration": "registration.html",
  "/login": "login.html",
};

const usersFile = path.join(__dirname, "data", "users.json");

function servePage(fileName, response) {
  const filePath = path.join(__dirname, fileName);

  fs.readFile(filePath, "utf8", (error, data) => {
    if (error) {
      response.writeHead(500, {
        "Content-Type": "text/html",
      });

      response.end("<h1>500 - Server Error</h1>");

      return;
    }

    response.writeHead(200, {
      "Content-Type": "text/html",
    });

    response.end(data);
  });
}

function handleRegistration(request, response) {
  let body = "";

  request.on("data", (chunk) => {
    body += chunk.toString();
  });

  request.on("end", () => {
    const formData = querystring.parse(body);

    fs.readFile(usersFile, "utf8", (readError, data) => {
      let users = [];

      if (!readError && data.trim()) {
        try {
          users = JSON.parse(data);
        } catch (error) {
          users = [];
        }
      }

      const newUser = {
        id: Date.now(),
        fullName: formData.fullName || "",
        email: formData.email || "",
        phone: formData.phone || "",
        college: formData.college || "",
        course: formData.course || "",
        year: formData.year || "",
        password: formData.password || "",
      };

      users.push(newUser);

      fs.writeFile(
        usersFile,
        JSON.stringify(users, null, 2),
        "utf8",
        (writeError) => {
          if (writeError) {
            response.writeHead(500, {
              "Content-Type": "text/html",
            });

            response.end("<h1>500 - Could not save registration</h1>");

            return;
          }

          response.writeHead(302, {
            Location: "/registration?success=true",
          });

          response.end();
        },
      );
    });
  });
}

function handleLogin(request, response) {
  let body = "";

  request.on("data", (chunk) => {
    body += chunk.toString();
  });

  request.on("end", () => {
    const formData = querystring.parse(body);

    const email = formData.email || "";
    const password = formData.password || "";

    fs.readFile(usersFile, "utf8", (readError, data) => {
      if (readError) {
        response.writeHead(500, {
          "Content-Type": "text/html",
        });

        response.end("<h1>500 - Could not read users</h1>");

        return;
      }

      let users = [];

      try {
        users = JSON.parse(data);
      } catch (error) {
        users = [];
      }

      const user = users.find(
        (item) => item.email === email && item.password === password,
      );

      if (user) {
        response.writeHead(302, {
          Location: "/login?success=true",
        });

        response.end();
      } else {
        response.writeHead(302, {
          Location: "/login?error=invalid",
        });

        response.end();
      }
    });
  });
}

const server = http.createServer((request, response) => {
  const urlPath = request.url.split("?")[0];

  // Registration

  if (request.method === "POST" && urlPath === "/registration") {
    handleRegistration(request, response);

    return;
  }

  // Login

  if (request.method === "POST" && urlPath === "/login") {
    handleLogin(request, response);

    return;
  }

  // Pages

  const fileName = pages[urlPath];

  if (!fileName) {
    response.writeHead(404, {
      "Content-Type": "text/html",
    });

    response.end("<h1>404 - Page Not Found</h1>");

    return;
  }

  servePage(fileName, response);
});

server.listen(port, () => {
  console.log("Server running at http://localhost:" + port);
});
