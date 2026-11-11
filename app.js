(function () {
  "use strict";

  var CHAPTERS = {
    1: "医薬品に共通する特性と基本的な知識",
    2: "人体の働きと医薬品",
    3: "主な医薬品とその作用",
    4: "薬事関係法規・制度",
    5: "医薬品の適正使用・安全対策"
  };
  var CHAPTER_SHORT = { 1: "基本知識", 2: "人体", 3: "主な医薬品", 4: "法規・制度", 5: "適正使用" };
  var STORE_KEY = "touhan-kakomon-v1";
  var META_KEY = "touhan-kakomon-meta-v1";
  var DAILY_GOAL = 10;
  var CTA_URL = "https://touhanwork.com/lp/mikeiken/?utm_source=kakomon&utm_medium=app";
  var SOURCE_URL = "https://www.kouiki-kansai.jp/koikirengo/jisijimu/shikakumenkyo/touroku/7607.html";
  var SOURCE_URL_HT = "https://www.pref.hokkaido.lg.jp/hf/iyk/iry/yakuji/tourokuhannbaishashikenmondai.html";

  var QUESTIONS = (window.QUESTIONS || []).slice();
  var app = document.getElementById("app");

  function loadKey(key) {
    try { return JSON.parse(localStorage.getItem(key)) || {}; } catch (e) { return {}; }
  }
  function saveKey(key, data) {
    try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) { /* ストレージが使えない環境では記録しない */ }
  }
  var progress = loadKey(STORE_KEY);
  var meta = loadKey(META_KEY);
  if (!meta.days) meta.days = {};

  function h(tag, attrs, children) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === "class") el.className = attrs[k];
      else if (k === "onclick") el.addEventListener("click", attrs[k]);
      else if (k === "html") el.innerHTML = attrs[k];
      else el.setAttribute(k, attrs[k]);
    });
    [].concat(children == null ? [] : children).forEach(function (c) {
      if (c == null || c === false) return;
      el.appendChild(typeof c === "string" || typeof c === "number" ? document.createTextNode(String(c)) : c);
    });
    return el;
  }
  function render(nodes) {
    app.replaceChildren.apply(app, [].concat(nodes).filter(Boolean));
    window.scrollTo(0, 0);
  }
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function pct(a, b) { return b ? Math.round((a / b) * 100) : 0; }
  function fmt(n) { return Number(n).toLocaleString("ja-JP"); }

  // ---- 日付と「今日の10問」・連続日数 ----
  function dayKey(d) {
    d = d || new Date();
    return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
  }
  function todayCount() { return meta.days[dayKey()] || 0; }
  function streak() {
    var d = new Date(), n = 0;
    if (!meta.days[dayKey(d)]) d.setDate(d.getDate() - 1);
    while (meta.days[dayKey(d)]) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  function examDaysLeft() {
    if (!meta.examDate) return null;
    var p = meta.examDate.split("-");
    var exam = new Date(+p[0], +p[1] - 1, +p[2]);
    var t = new Date(); t.setHours(0, 0, 0, 0);
    return Math.round((exam - t) / 86400000);
  }

  // ---- 出典（試験回）の表示名 ----
  function blockOf(q) { return q.source.indexOf("北海道") === 0 ? "北海道・東北" : "関西"; }
  function sessionLabel(q) {
    return q.source.replace("関西広域連合 ", "").replace("北海道・東北ブロック ", "").replace(" 登録販売者試験", "");
  }
  function sourceShort(q) { return blockOf(q) + " " + sessionLabel(q).replace("令和", "R").replace("年度", ""); }

  function statsOf(list) {
    var o = 0, x = 0;
    list.forEach(function (q) { var p = progress[q.id]; if (p) { if (p.last) o++; else x++; } });
    return { total: list.length, o: o, x: x, n: list.length - o - x, done: o + x };
  }
  function weakQuestions() {
    return QUESTIONS.filter(function (q) { return progress[q.id] && !progress[q.id].last; });
  }
  function byChapter(ch) { return QUESTIONS.filter(function (q) { return q.chapter === ch; }); }

  // 今日の10問：まだ解いていない問題を優先し、足りなければ間違えた問題から
  function dailySet() {
    var fresh = shuffle(QUESTIONS.filter(function (q) { return !progress[q.id]; }));
    var weak = shuffle(weakQuestions());
    return fresh.concat(weak).concat(shuffle(QUESTIONS)).slice(0, DAILY_GOAL);
  }

  function marks(s) {
    return h("div", { "class": "marks" }, [
      h("span", { "class": "mk o" }, "○ " + s.o),
      h("span", { "class": "mk x" }, "× " + s.x),
      h("span", { "class": "mk n" }, "未 " + s.n)
    ]);
  }
  function chev() { return h("span", { "class": "chev", "aria-hidden": "true" }, "›"); }

  function ring(done, goal) {
    var r = 28, c = 2 * Math.PI * r, f = Math.min(done, goal) / goal * c;
    return h("div", { "class": "ring", html:
      '<svg width="72" height="72" viewBox="0 0 72 72" aria-hidden="true">' +
      '<circle class="bg" cx="36" cy="36" r="' + r + '" fill="none" stroke-width="8"/>' +
      '<circle class="fg" cx="36" cy="36" r="' + r + '" fill="none" stroke-width="8" stroke-linecap="round" stroke-dasharray="' + f.toFixed(1) + ' ' + c.toFixed(1) + '" transform="rotate(-90 36 36)"/>' +
      '<text x="36" y="41" text-anchor="middle" font-size="15">' + Math.min(done, goal) + "/" + goal + "</text></svg>" });
  }

  function footer() {
    return h("div", { "class": "footer wrap" }, [
      h("p", null, "問題の出典：関西広域連合の登録販売者試験問題（令和4〜8年度）、北海道の登録販売者試験問題（北海道・東北ブロック、令和3〜8年度。CC BY 4.0）を加工して作成。"),
      h("a", { href: SOURCE_URL, target: "_blank", rel: "noopener" }, "出典：関西広域連合ホームページ"),
      h("br"),
      h("a", { href: SOURCE_URL_HT, target: "_blank", rel: "noopener" }, "出典：北海道ホームページ「登録販売者試験問題について」"),
      h("p", null, "解説は登販ワークが作成したものです。本アプリは関西広域連合・北海道とは関係ありません。法令・制度は改正されることがあります。受験する試験の最新情報は、各都道府県の公式発表や厚生労働省の資料でご確認ください。学習の成果や合格を保証するものではありません。")
    ]);
  }

  function ctaCard() {
    return h("div", { "class": "card cta" }, [
      h("strong", null, "合格後のお仕事探しは、登販ワークへ"),
      h("p", { "class": "sub" }, "合格したばかりで実務経験がない方（研修中）の働き方や、求人紹介のご相談を無料で受け付けています。"),
      h("a", { "class": "btn", href: CTA_URL, target: "_blank", rel: "noopener", style: "text-decoration:none;color:inherit" }, "合格後の働き方を見る")
    ]);
  }

  function countCard() {
    var left = examDaysLeft();
    if (left !== null && left >= 0) {
      return h("div", { "class": "card count" }, [
        h("div", null, [h("div", { "class": "sub" }, "試験まであと"), h("div", { "class": "days" }, [String(left), h("small", null, "日")])]),
        h("button", { "class": "link", type: "button", onclick: function () { meta.examDate = ""; saveKey(META_KEY, meta); home(); } }, "試験日を変える")
      ]);
    }
    var input = h("input", { type: "date", "aria-label": "試験日" });
    input.addEventListener("change", function () {
      if (input.value) { meta.examDate = input.value; saveKey(META_KEY, meta); home(); }
    });
    return h("div", { "class": "card count" }, [
      h("div", null, [h("div", { style: "font-weight:700" }, "試験日を入れる"), h("div", { "class": "sub" }, "残りの日数を表示します")]),
      input
    ]);
  }

  // ---- ホーム ----
  function home() {
    var all = statsOf(QUESTIONS);
    var tc = todayCount(), st = streak();
    var nodes = [
      h("div", { "class": "hero" }, [
        h("div", { "class": "name" }, "登録販売者 過去問トレーニング"),
        h("div", { "class": "big" }, [h("b", null, fmt(QUESTIONS.length)), h("span", null, "問　全問解説つき")]),
        h("div", { "class": "lead" }, "関西・北海道東北の過去問（令和3〜8年度）"),
        h("div", { "class": "pills" }, [h("span", { "class": "pill" }, "無料"), h("span", { "class": "pill" }, "広告なし"), h("span", { "class": "pill" }, "登録不要")])
      ]),
      h("div", { "class": "lift" }, h("div", { "class": "card" }, [
        h("div", { "class": "today" }, [
          ring(tc, DAILY_GOAL),
          h("div", { style: "flex:1" }, [
            h("div", { "class": "t" }, tc >= DAILY_GOAL ? "今日の10問、達成です" : "今日の10問"),
            h("div", { "class": "sub" }, [
              st > 0 ? h("span", { "class": "streak" }, st + "日連続") : null,
              " 解いた問題 " + fmt(all.done) + "／正答率 " + (all.done ? pct(all.o, all.done) + "%" : "-")
            ])
          ])
        ]),
        h("button", { "class": "btn primary", type: "button", onclick: function () { startQuiz("今日の10問", dailySet()); } },
          tc >= DAILY_GOAL ? "もう10問解く" : (tc ? "続きを解く" : "今日の10問をはじめる"))
      ]))
    ];

    var body = h("div", { "class": "wrap" });
    body.appendChild(countCard());

    var weak = weakQuestions();
    if (weak.length) {
      body.appendChild(h("button", { "class": "row-btn review", type: "button", onclick: function () { startQuiz("間違えた問題の復習", shuffle(weak)); } }, [
        h("span", { "class": "ico", "aria-hidden": "true" }, "↺"),
        h("span", { "class": "main" }, [h("div", { "class": "ttl" }, "間違えた問題を復習"), h("div", { "class": "meta" }, weak.length + "問たまっています")]),
        chev()
      ]));
    }

    body.appendChild(h("h2", null, ["章ごとに解く", h("small", null, "手引きの5章")]));
    Object.keys(CHAPTERS).forEach(function (k) {
      var ch = +k, list = byChapter(ch), s = statsOf(list);
      if (!s.total) return;
      body.appendChild(h("button", { "class": "row-btn", type: "button", onclick: function () { chapterMenu(ch); } }, [
        h("span", { "class": "ico", "aria-hidden": "true" }, String(ch)),
        h("span", { "class": "main" }, [
          h("div", { "class": "ttl" }, "第" + ch + "章 " + CHAPTER_SHORT[ch]),
          h("div", { "class": "meta" }, fmt(s.total) + "問 ／ 解いた " + fmt(s.done) + "問" + (s.done ? "（正答率 " + pct(s.o, s.done) + "%）" : "")),
          h("div", { "class": "bar" }, h("i", { style: "width:" + pct(s.done, s.total) + "%" }))
        ]),
        chev()
      ]));
    });

    body.appendChild(h("h2", null, ["年度別に解く", h("small", null, "本番と同じ順番")]));
    body.appendChild(h("button", { "class": "row-btn", type: "button", onclick: examMenu }, [
      h("span", { "class": "ico", "aria-hidden": "true" }, "年"),
      h("span", { "class": "main" }, [h("div", { "class": "ttl" }, "試験回を選ぶ"), h("div", { "class": "meta" }, "関西 令和4〜8年度・北海道東北 令和3〜8年度")]),
      chev()
    ]));
    body.appendChild(h("button", { "class": "row-btn", type: "button", onclick: function () { startQuiz("全章ランダム10問", shuffle(QUESTIONS).slice(0, 10)); } }, [
      h("span", { "class": "ico", "aria-hidden": "true" }, "?"),
      h("span", { "class": "main" }, [h("div", { "class": "ttl" }, "全章ランダム10問"), h("div", { "class": "meta" }, "力試しに")]),
      chev()
    ]));

    body.appendChild(ctaCard());
    body.appendChild(h("button", { "class": "btn ghost", type: "button", onclick: function () {
      if (confirm("学習記録をすべて消去します。よろしいですか？")) { progress = {}; meta = { days: {}, examDate: meta.examDate }; saveKey(STORE_KEY, progress); saveKey(META_KEY, meta); home(); }
    } }, "学習記録をリセット"));
    nodes.push(body, footer());
    render(nodes);
  }

  function backBar(title) {
    return h("div", { "class": "top" }, [
      h("button", { "class": "x", type: "button", "aria-label": "ホームに戻る", onclick: home }, "‹"),
      h("div", { style: "flex:1;font-weight:700" }, title)
    ]);
  }

  // 章を選んだあと：まだ解いていない問題／全部／間違えた問題
  function chapterMenu(ch) {
    var list = byChapter(ch), s = statsOf(list);
    var fresh = list.filter(function (q) { return !progress[q.id]; });
    var wrong = list.filter(function (q) { return progress[q.id] && !progress[q.id].last; });
    function item(label, metaText, qs, title) {
      return h("button", { "class": "row-btn", type: "button", onclick: function () {
        if (!qs.length) { alert("該当する問題はありません。"); return; }
        startQuiz(title, qs);
      } }, [h("span", { "class": "main" }, [h("div", { "class": "ttl" }, label), h("div", { "class": "meta" }, metaText)]), chev()]);
    }
    render([
      backBar("第" + ch + "章"),
      h("div", { "class": "wrap" }, [
        h("div", { "class": "card" }, [
          h("div", { style: "font-weight:700" }, CHAPTERS[ch]),
          h("div", { "class": "sub" }, fmt(s.total) + "問"),
          marks(s),
          h("div", { "class": "bar" }, h("i", { style: "width:" + pct(s.done, s.total) + "%" }))
        ]),
        item("まだ解いていない問題から10問", fmt(fresh.length) + "問残っています", shuffle(fresh).slice(0, 10), "第" + ch + "章 未解答"),
        item("ランダムに20問", "解いた問題も含めて出題", shuffle(list).slice(0, 20), "第" + ch + "章 ランダム"),
        item("間違えた問題だけ", fmt(wrong.length) + "問", shuffle(wrong), "第" + ch + "章 復習"),
        item("この章をすべて", "出題順に" + fmt(s.total) + "問", list, "第" + ch + "章 すべて")
      ]),
      footer()
    ]);
  }

  // 年度別：ブロック → 試験回
  function examMenu() {
    var groups = {}, order = [];
    QUESTIONS.forEach(function (q) {
      if (!groups[q.source]) { groups[q.source] = []; order.push(q.source); }
      groups[q.source].push(q);
    });
    // 関西 → 北海道・東北、新しい年度から、同じ年度は前半（午前）→後半（午後）
    function sortKey(src) {
      var y = +((src.match(/令和(\d+)年度/) || [0, 0])[1]);
      var pm = /後半|午後/.test(src) ? 1 : 0;
      return (src.indexOf("北海道") === 0 ? 1 : 0) * 1000 + (100 - y) * 2 + pm;
    }
    order.sort(function (a, b) { return sortKey(a) - sortKey(b); });
    var body = h("div", { "class": "wrap" }, h("p", { "class": "sub" }, "本番の試験と同じ順番で出題します。表や図がある問題など、一部はのぞいています。"));
    var lastBlock = "";
    order.forEach(function (src) {
      var list = groups[src].slice().sort(function (a, b) { return a.no - b.no; });
      var blk = blockOf(list[0]);
      if (blk !== lastBlock) { body.appendChild(h("div", { "class": "blk" }, blk + (blk === "関西" ? "（関西広域連合）" : "ブロック"))); lastBlock = blk; }
      var s = statsOf(list);
      body.appendChild(h("button", { "class": "row-btn", type: "button", onclick: function () { startQuiz(sourceShort(list[0]), list); } }, [
        h("span", { "class": "main" }, [
          h("div", { "class": "ttl" }, sessionLabel(list[0]) + "　" + list.length + "問"),
          marks(s)
        ]),
        chev()
      ]));
    });
    render([backBar("年度別に解く"), body, footer()]);
  }

  function startQuiz(title, list) {
    if (!list.length) { alert("問題がありません。"); return; }
    question({ title: title, list: list, i: 0, right: 0, log: [] });
  }

  function showMark(ok) {
    var svg = ok
      ? '<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="38" fill="none" stroke="#e53935" stroke-width="11"/></svg>'
      : '<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M22 22L78 78M78 22L22 78" stroke="#1e63c6" stroke-width="11" stroke-linecap="round"/></svg>';
    var el = h("div", { "class": "mark", html: svg });
    document.body.appendChild(el);
    setTimeout(function () { el.remove(); }, 650);
  }

  // ---- 問題 ----
  function question(state) {
    var q = state.list[state.i];
    var answered = false;
    var top = h("div", { "class": "top" }, [
      h("button", { "class": "x", type: "button", "aria-label": "やめてホームに戻る", onclick: function () {
        if (!state.log.length || confirm("ここでやめてホームに戻りますか？（解いた記録は残ります）")) home();
      } }, "×"),
      h("div", { "class": "bar" }, h("i", { style: "width:" + pct(state.i, state.list.length) + "%" })),
      h("div", { "class": "n" }, (state.i + 1) + " / " + state.list.length)
    ]);
    var body = h("div", { "class": "wrap" }, [
      h("div", { "class": "chips" }, [
        h("span", { "class": "chip" }, "第" + q.chapter + "章 " + CHAPTER_SHORT[q.chapter]),
        h("span", { "class": "chip gray" }, sourceShort(q) + " 問" + q.no)
      ]),
      h("p", { "class": "stem" }, q.stem),
      (q.statements && q.statements.length) ? h("div", { "class": "stmts" }, q.statements.map(function (s) {
        return h("div", { "class": "stmt" }, [h("b", null, s.label), h("span", null, s.text)]);
      })) : null
    ]);
    var optBox = h("div", null);
    var feedback = h("div", null);
    var next = h("div", null);
    q.options.forEach(function (o) {
      var btn = h("button", { "class": "opt", type: "button", "data-n": String(o.n) }, [h("span", { "class": "num" }, String(o.n)), h("span", null, o.text)]);
      btn.addEventListener("click", function () {
        if (answered) return;
        answered = true;
        var ok = o.n === q.answer;
        if (ok) state.right++;
        state.log.push({ q: q, ok: ok });
        progress[q.id] = { last: ok, at: Date.now() };
        saveKey(STORE_KEY, progress);
        meta.days[dayKey()] = todayCount() + 1;
        saveKey(META_KEY, meta);
        showMark(ok);
        [].forEach.call(optBox.children, function (b) {
          b.disabled = true;
          var n = +b.getAttribute("data-n");
          if (n === q.answer) b.classList.add("ok");
          else if (n === o.n) b.classList.add("ng");
          else b.classList.add("dim");
        });
        var last = state.i === state.list.length - 1;
        feedback.replaceChildren(h("div", { "class": "res " + (ok ? "ok" : "ng") }, [
          h("div", { "class": "h" }, ok ? "正解！" : "おしい！ 正解は " + q.answer),
          h("p", { "class": "expl" }, q.explanation),
          h("div", null, (q.tags || []).map(function (t) { return h("span", { "class": "tag" }, t); }))
        ]));
        next.replaceChildren(h("div", { "class": "next" }, h("button", { "class": "btn primary", type: "button", onclick: function () {
          if (last) summary(state); else { state.i++; question(state); }
        } }, last ? "結果を見る" : "次の問題へ")));
        setTimeout(function () { feedback.scrollIntoView({ behavior: "smooth", block: "start" }); }, 250);
      });
      optBox.appendChild(btn);
    });
    body.appendChild(optBox);
    body.appendChild(feedback);
    render([top, body, next]);
  }

  // ---- 結果 ----
  function summary(state) {
    var n = state.log.length, rate = pct(state.right, n);
    var wrong = state.log.filter(function (l) { return !l.ok; }).map(function (l) { return l.q; });
    render([
      backBar("結果"),
      h("div", { "class": "wrap" }, [
        h("div", { "class": "card score" }, [
          h("div", { "class": "sub" }, state.title),
          h("div", { "class": "pct" }, [String(rate), h("small", null, "%")]),
          h("div", { style: "font-weight:700;margin-top:4px" }, n + "問中 " + state.right + "問 正解"),
          h("div", { "class": "dots" }, state.log.map(function (l, i) { return h("span", { "class": "dot " + (l.ok ? "o" : "x") }, String(i + 1)); }))
        ]),
        wrong.length ? h("button", { "class": "btn primary", type: "button", onclick: function () { startQuiz(state.title + "（間違えた問題）", wrong); } }, "間違えた" + wrong.length + "問を解き直す") : null,
        h("button", { "class": "btn", type: "button", onclick: function () { startQuiz(state.title, shuffle(state.list)); } }, "もう一度解く"),
        h("button", { "class": "btn ghost", type: "button", onclick: home }, "ホームに戻る"),
        ctaCard()
      ]),
      footer()
    ]);
  }

  if ("serviceWorker" in navigator && location.protocol.indexOf("http") === 0) {
    navigator.serviceWorker.register("sw.js").catch(function () {});
  }

  // ホーム画面への追加（PWAインストール）の計測。GoatCounter導入後に有効化される（未導入時は何もしない）。
  function trackInstallEvent(name) {
    try {
      if (window.goatcounter && window.goatcounter.count) {
        window.goatcounter.count({ path: name, event: true });
      }
    } catch (e) { /* 解析スクリプト未導入でも動作に影響させない */ }
  }
  window.addEventListener("appinstalled", function () { trackInstallEvent("pwa-installed"); });
  try {
    var isStandalone = window.matchMedia && window.matchMedia("(display-mode: standalone)").matches;
    var seenKey = "touhan-kakomon-standalone-seen";
    if (isStandalone && !localStorage.getItem(seenKey)) {
      localStorage.setItem(seenKey, "1");
      trackInstallEvent("pwa-first-standalone-launch");
    }
  } catch (e) {}

  if (!QUESTIONS.length) {
    render([h("div", { "class": "wrap" }, [h("h2", null, "登録販売者 過去問トレーニング"), h("p", { "class": "sub" }, "問題データがありません。data.js を確認してください。")])]);
  } else {
    home();
  }
})();
