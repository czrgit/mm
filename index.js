const path = require("path");
const express = require("express");
const request = require("request");
const cors = require("cors");
const morgan = require("morgan");
const { init: initDB, Counter } = require("./db");

const logger = morgan("tiny");

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());
app.use(logger);

// 首页
app.get("/", async (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// 更新计数
app.post("/api/count", async (req, res) => {
  const { action } = req.body;
  if (action === "inc") {
    await Counter.create();
  } else if (action === "clear") {
    await Counter.destroy({
      truncate: true,
    });
  }
  res.send({
    code: 0,
    data: await Counter.count(),
  });
});

// 获取计数
app.get("/api/count", async (req, res) => {
  const result = await Counter.count();
  res.send({
    code: 0,
    data: result,
  });
});

// 小程序调用，获取微信 Open ID
app.get("/api/wx_openid", async (req, res) => {
  if (req.headers["x-wx-source"]) {
    res.send(req.headers["x-wx-openid"]);
  }
});

app.post("/send/msg", async (req, res) => {
  const appid = "wxf77684cd83c932c0";
  const appsecret = "ad4be3ffac458ea7e9a567e6a9caf379";
  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${appsecret}`;
  const tokenResult = await getToken(url);
  const url2 =
    "https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=" +
    tokenResult.access_token;
  const data = {
    touser: "oXARP5tzMtKEOHDmsmszDOzDCaFc-W9FoxdLM",
    template_id: "bSXjlbsyFCJqAN0LS0QtyIhST1kajhX_1I-W9FoxdLM",
    url: "http://weixin.qq.com/download",
    topcolor: "#FF0000",
    data: {
      date: {
        value: "147",
      },
    },
  };
  const Result = await postTemplate(url2, data);
  console.log("[no class] [no function] [Result]", Result);
  console.log(
    "[no class] [no function] [tokenResult]",
    tokenResult.access_token
  );
  res.send({
    code: 0,
    data: { tokenResult, Result },
  });
});
async function getToken(url) {
  return new Promise((resolve, reject) => {
    request(
      {
        url,
        method: "GET",
      },
      function (error, res) {
        if (error) reject(error);
        resolve(JSON.parse(res.body));
      }
    );
  });
}
async function postTemplate(url, data) {
  return new Promise((resolve, reject) => {
    request(
      {
        url,
        method: "POST",
        body: JSON.stringify(data),
      },
      function (error, res) {
        if (error) reject(error);
        resolve(res.body);
      }
    );
  });
}
const port = process.env.PORT || 80;

async function bootstrap() {
  await initDB();
  app.listen(port, () => {
    console.log("启动成功", port);
  });
}

bootstrap();
