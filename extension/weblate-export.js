/*
  Кнопка-закладка «Выгрузка из Weblate».
  Запускается на странице weblate.wb.ru и работает через текущий вход в Weblate
  (без токена и без установки программ). Это исходник; закладку из него
  собирает build.py в index.html.
  Не использовать однострочные комментарии: код живёт в URL закладки.
*/
(function () {
  if (window.__wlExport) { window.__wlExport.show(); return; }

  var QUERY_ALL = 'state:<translated';
  var QUERY_EMPTY = 'state:empty';

  /* ---------- языки: русские названия и флаги ---------- */
  var FLAGS = {"am": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"64\" height=\"48\" viewBox=\"0 0 64 48\"><defs><linearGradient id=\"am-shine\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#ffffff\" stop-opacity=\".22\"/><stop offset=\".45\" stop-color=\"#ffffff\" stop-opacity=\".04\"/><stop offset=\"1\" stop-color=\"#000000\" stop-opacity=\".10\"/></linearGradient><filter id=\"am-shadow\" x=\"-20%\" y=\"-20%\" width=\"140%\" height=\"150%\"><feDropShadow dx=\"0\" dy=\"1.5\" stdDeviation=\"1.3\" flood-opacity=\".22\"/></filter><clipPath id=\"am-clip\"><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\"/></clipPath></defs><g filter=\"url(#am-shadow)\" clip-path=\"url(#am-clip)\"><rect x=\"0\" y=\"0\" width=\"64\" height=\"16\" fill=\"#078930\"/><rect x=\"0\" y=\"16\" width=\"64\" height=\"16\" fill=\"#FCDD09\"/><rect x=\"0\" y=\"32\" width=\"64\" height=\"16\" fill=\"#DA121A\"/><circle cx=\"32\" cy=\"24\" r=\"8\" fill=\"#0F47AF\"/><circle cx=\"32\" cy=\"24\" r=\"3\" fill=\"#FCDD09\"/><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"url(#am-shine)\"/></g><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"none\" stroke=\"#000\" stroke-opacity=\".10\"/></svg>", "ar": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"64\" height=\"48\" viewBox=\"0 0 64 48\"><defs><linearGradient id=\"ar-shine\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#ffffff\" stop-opacity=\".22\"/><stop offset=\".45\" stop-color=\"#ffffff\" stop-opacity=\".04\"/><stop offset=\"1\" stop-color=\"#000000\" stop-opacity=\".10\"/></linearGradient><filter id=\"ar-shadow\" x=\"-20%\" y=\"-20%\" width=\"140%\" height=\"150%\"><feDropShadow dx=\"0\" dy=\"1.5\" stdDeviation=\"1.3\" flood-opacity=\".22\"/></filter><clipPath id=\"ar-clip\"><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\"/></clipPath></defs><g filter=\"url(#ar-shadow)\" clip-path=\"url(#ar-clip)\"><rect x=\"0\" y=\"0\" width=\"64\" height=\"48\" fill=\"#006C35\"/><rect x=\"13\" y=\"20\" width=\"38\" height=\"3\" fill=\"#fff\"/><rect x=\"18\" y=\"25\" width=\"28\" height=\"2\" fill=\"#fff\"/><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"url(#ar-shine)\"/></g><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"none\" stroke=\"#000\" stroke-opacity=\".10\"/></svg>", "az": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"64\" height=\"48\" viewBox=\"0 0 64 48\"><defs><linearGradient id=\"az-shine\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#ffffff\" stop-opacity=\".22\"/><stop offset=\".45\" stop-color=\"#ffffff\" stop-opacity=\".04\"/><stop offset=\"1\" stop-color=\"#000000\" stop-opacity=\".10\"/></linearGradient><filter id=\"az-shadow\" x=\"-20%\" y=\"-20%\" width=\"140%\" height=\"150%\"><feDropShadow dx=\"0\" dy=\"1.5\" stdDeviation=\"1.3\" flood-opacity=\".22\"/></filter><clipPath id=\"az-clip\"><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\"/></clipPath></defs><g filter=\"url(#az-shadow)\" clip-path=\"url(#az-clip)\"><rect x=\"0\" y=\"0\" width=\"64\" height=\"16\" fill=\"#00B5E2\"/><rect x=\"0\" y=\"16\" width=\"64\" height=\"16\" fill=\"#EF3340\"/><rect x=\"0\" y=\"32\" width=\"64\" height=\"16\" fill=\"#509E2F\"/><circle cx=\"29\" cy=\"24\" r=\"7\" fill=\"#fff\"/><circle cx=\"32\" cy=\"24\" r=\"5.8\" fill=\"#EF3340\"/><polygon points=\"35,19 36.7,22 40,22 37.4,24.1 38.3,27.5 35,25.5 31.7,27.5 32.6,24.1 30,22 33.3,22\" fill=\"#fff\"/><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"url(#az-shine)\"/></g><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"none\" stroke=\"#000\" stroke-opacity=\".10\"/></svg>", "be": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"64\" height=\"48\" viewBox=\"0 0 64 48\"><defs><linearGradient id=\"be-shine\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#ffffff\" stop-opacity=\".22\"/><stop offset=\".45\" stop-color=\"#ffffff\" stop-opacity=\".04\"/><stop offset=\"1\" stop-color=\"#000000\" stop-opacity=\".10\"/></linearGradient><filter id=\"be-shadow\" x=\"-20%\" y=\"-20%\" width=\"140%\" height=\"150%\"><feDropShadow dx=\"0\" dy=\"1.5\" stdDeviation=\"1.3\" flood-opacity=\".22\"/></filter><clipPath id=\"be-clip\"><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\"/></clipPath></defs><g filter=\"url(#be-shadow)\" clip-path=\"url(#be-clip)\"><rect x=\"0\" y=\"0\" width=\"64\" height=\"32\" fill=\"#CE1720\"/><rect x=\"0\" y=\"32\" width=\"64\" height=\"16\" fill=\"#007C30\"/><rect x=\"0\" y=\"0\" width=\"9\" height=\"48\" fill=\"#fff\"/><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"url(#be-shine)\"/></g><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"none\" stroke=\"#000\" stroke-opacity=\".10\"/></svg>", "en": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"64\" height=\"48\" viewBox=\"0 0 64 48\"><defs><linearGradient id=\"en-shine\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#ffffff\" stop-opacity=\".22\"/><stop offset=\".45\" stop-color=\"#ffffff\" stop-opacity=\".04\"/><stop offset=\"1\" stop-color=\"#000000\" stop-opacity=\".10\"/></linearGradient><filter id=\"en-shadow\" x=\"-20%\" y=\"-20%\" width=\"140%\" height=\"150%\"><feDropShadow dx=\"0\" dy=\"1.5\" stdDeviation=\"1.3\" flood-opacity=\".22\"/></filter><clipPath id=\"en-clip\"><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\"/></clipPath></defs><g filter=\"url(#en-shadow)\" clip-path=\"url(#en-clip)\"><rect x=\"0\" y=\"0\" width=\"64\" height=\"48\" fill=\"#012169\"/><polygon points=\"0,0 8,0 64,40 64,48 56,48 0,8\" fill=\"#fff\"/><polygon points=\"56,0 64,0 64,8 8,48 0,48 0,40\" fill=\"#fff\"/><polygon points=\"0,0 3.5,0 64,44 64,48 60.5,48 0,4\" fill=\"#C8102E\"/><polygon points=\"60.5,0 64,0 64,4 3.5,48 0,48 0,44\" fill=\"#C8102E\"/><rect x=\"26\" y=\"0\" width=\"12\" height=\"48\" fill=\"#fff\"/><rect x=\"0\" y=\"18\" width=\"64\" height=\"12\" fill=\"#fff\"/><rect x=\"29\" y=\"0\" width=\"6\" height=\"48\" fill=\"#C8102E\"/><rect x=\"0\" y=\"21\" width=\"64\" height=\"6\" fill=\"#C8102E\"/><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"url(#en-shine)\"/></g><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"none\" stroke=\"#000\" stroke-opacity=\".10\"/></svg>", "fr": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"64\" height=\"48\" viewBox=\"0 0 64 48\"><defs><linearGradient id=\"fr-shine\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#ffffff\" stop-opacity=\".22\"/><stop offset=\".45\" stop-color=\"#ffffff\" stop-opacity=\".04\"/><stop offset=\"1\" stop-color=\"#000000\" stop-opacity=\".10\"/></linearGradient><filter id=\"fr-shadow\" x=\"-20%\" y=\"-20%\" width=\"140%\" height=\"150%\"><feDropShadow dx=\"0\" dy=\"1.5\" stdDeviation=\"1.3\" flood-opacity=\".22\"/></filter><clipPath id=\"fr-clip\"><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\"/></clipPath></defs><g filter=\"url(#fr-shadow)\" clip-path=\"url(#fr-clip)\"><rect x=\"0\" y=\"0\" width=\"21.33\" height=\"48\" fill=\"#0055A4\"/><rect x=\"21.33\" y=\"0\" width=\"21.34\" height=\"48\" fill=\"#fff\"/><rect x=\"42.67\" y=\"0\" width=\"21.33\" height=\"48\" fill=\"#EF4135\"/><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"url(#fr-shine)\"/></g><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"none\" stroke=\"#000\" stroke-opacity=\".10\"/></svg>", "he": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"64\" height=\"48\" viewBox=\"0 0 64 48\"><defs><linearGradient id=\"he-shine\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#ffffff\" stop-opacity=\".22\"/><stop offset=\".45\" stop-color=\"#ffffff\" stop-opacity=\".04\"/><stop offset=\"1\" stop-color=\"#000000\" stop-opacity=\".10\"/></linearGradient><filter id=\"he-shadow\" x=\"-20%\" y=\"-20%\" width=\"140%\" height=\"150%\"><feDropShadow dx=\"0\" dy=\"1.5\" stdDeviation=\"1.3\" flood-opacity=\".22\"/></filter><clipPath id=\"he-clip\"><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\"/></clipPath></defs><g filter=\"url(#he-shadow)\" clip-path=\"url(#he-clip)\"><rect x=\"0\" y=\"0\" width=\"64\" height=\"48\" fill=\"#fff\"/><rect x=\"0\" y=\"5\" width=\"64\" height=\"7\" fill=\"#0038B8\"/><rect x=\"0\" y=\"36\" width=\"64\" height=\"7\" fill=\"#0038B8\"/><polygon points=\"32,12 40,27 24,27\" fill=\"#0038B8\"/><polygon points=\"32,36 24,21 40,21\" fill=\"#0038B8\"/><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"url(#he-shine)\"/></g><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"none\" stroke=\"#000\" stroke-opacity=\".10\"/></svg>", "hy": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"64\" height=\"48\" viewBox=\"0 0 64 48\"><defs><linearGradient id=\"hy-shine\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#ffffff\" stop-opacity=\".22\"/><stop offset=\".45\" stop-color=\"#ffffff\" stop-opacity=\".04\"/><stop offset=\"1\" stop-color=\"#000000\" stop-opacity=\".10\"/></linearGradient><filter id=\"hy-shadow\" x=\"-20%\" y=\"-20%\" width=\"140%\" height=\"150%\"><feDropShadow dx=\"0\" dy=\"1.5\" stdDeviation=\"1.3\" flood-opacity=\".22\"/></filter><clipPath id=\"hy-clip\"><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\"/></clipPath></defs><g filter=\"url(#hy-shadow)\" clip-path=\"url(#hy-clip)\"><rect x=\"0\" y=\"0\" width=\"64\" height=\"16\" fill=\"#D90012\"/><rect x=\"0\" y=\"16\" width=\"64\" height=\"16\" fill=\"#0033A0\"/><rect x=\"0\" y=\"32\" width=\"64\" height=\"16\" fill=\"#F2A800\"/><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"url(#hy-shine)\"/></g><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"none\" stroke=\"#000\" stroke-opacity=\".10\"/></svg>", "ka": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"64\" height=\"48\" viewBox=\"0 0 64 48\"><defs><linearGradient id=\"ka-shine\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#ffffff\" stop-opacity=\".22\"/><stop offset=\".45\" stop-color=\"#ffffff\" stop-opacity=\".04\"/><stop offset=\"1\" stop-color=\"#000000\" stop-opacity=\".10\"/></linearGradient><filter id=\"ka-shadow\" x=\"-20%\" y=\"-20%\" width=\"140%\" height=\"150%\"><feDropShadow dx=\"0\" dy=\"1.5\" stdDeviation=\"1.3\" flood-opacity=\".22\"/></filter><clipPath id=\"ka-clip\"><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\"/></clipPath></defs><g filter=\"url(#ka-shadow)\" clip-path=\"url(#ka-clip)\"><rect x=\"0\" y=\"0\" width=\"64\" height=\"48\" fill=\"#fff\"/><rect x=\"27\" y=\"0\" width=\"10\" height=\"48\" fill=\"#E4002B\"/><rect x=\"0\" y=\"19\" width=\"64\" height=\"10\" fill=\"#E4002B\"/><rect x=\"12.5\" y=\"7\" width=\"3\" height=\"10\" fill=\"#E4002B\"/><rect x=\"9\" y=\"10.5\" width=\"10\" height=\"3\" fill=\"#E4002B\"/><rect x=\"48.5\" y=\"7\" width=\"3\" height=\"10\" fill=\"#E4002B\"/><rect x=\"45\" y=\"10.5\" width=\"10\" height=\"3\" fill=\"#E4002B\"/><rect x=\"12.5\" y=\"31\" width=\"3\" height=\"10\" fill=\"#E4002B\"/><rect x=\"9\" y=\"34.5\" width=\"10\" height=\"3\" fill=\"#E4002B\"/><rect x=\"48.5\" y=\"31\" width=\"3\" height=\"10\" fill=\"#E4002B\"/><rect x=\"45\" y=\"34.5\" width=\"10\" height=\"3\" fill=\"#E4002B\"/><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"url(#ka-shine)\"/></g><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"none\" stroke=\"#000\" stroke-opacity=\".10\"/></svg>", "kk": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"64\" height=\"48\" viewBox=\"0 0 64 48\"><defs><linearGradient id=\"kk-shine\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#ffffff\" stop-opacity=\".22\"/><stop offset=\".45\" stop-color=\"#ffffff\" stop-opacity=\".04\"/><stop offset=\"1\" stop-color=\"#000000\" stop-opacity=\".10\"/></linearGradient><filter id=\"kk-shadow\" x=\"-20%\" y=\"-20%\" width=\"140%\" height=\"150%\"><feDropShadow dx=\"0\" dy=\"1.5\" stdDeviation=\"1.3\" flood-opacity=\".22\"/></filter><clipPath id=\"kk-clip\"><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\"/></clipPath></defs><g filter=\"url(#kk-shadow)\" clip-path=\"url(#kk-clip)\"><rect x=\"0\" y=\"0\" width=\"64\" height=\"48\" fill=\"#00AFCA\"/><circle cx=\"32\" cy=\"24\" r=\"8\" fill=\"#FEC50C\"/><polygon points=\"32,7 33.5,12 38,12 34.3,14.5 35.7,19 32,16.3 28.3,19 29.7,14.5 26,12 30.5,12\" fill=\"#FEC50C\"/><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"url(#kk-shine)\"/></g><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"none\" stroke=\"#000\" stroke-opacity=\".10\"/></svg>", "ko": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"64\" height=\"48\" viewBox=\"0 0 64 48\"><defs><linearGradient id=\"ko-shine\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#ffffff\" stop-opacity=\".22\"/><stop offset=\".45\" stop-color=\"#ffffff\" stop-opacity=\".04\"/><stop offset=\"1\" stop-color=\"#000000\" stop-opacity=\".10\"/></linearGradient><filter id=\"ko-shadow\" x=\"-20%\" y=\"-20%\" width=\"140%\" height=\"150%\"><feDropShadow dx=\"0\" dy=\"1.5\" stdDeviation=\"1.3\" flood-opacity=\".22\"/></filter><clipPath id=\"ko-clip\"><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\"/></clipPath></defs><g filter=\"url(#ko-shadow)\" clip-path=\"url(#ko-clip)\"><rect x=\"0\" y=\"0\" width=\"64\" height=\"48\" fill=\"#fff\"/><circle cx=\"32\" cy=\"24\" r=\"8\" fill=\"#CD2E3A\"/><circle cx=\"34.5\" cy=\"24\" r=\"6\" fill=\"#0047A0\"/><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"url(#ko-shine)\"/></g><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"none\" stroke=\"#000\" stroke-opacity=\".10\"/></svg>", "ky": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"64\" height=\"48\" viewBox=\"0 0 64 48\"><defs><linearGradient id=\"ky-shine\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#ffffff\" stop-opacity=\".22\"/><stop offset=\".45\" stop-color=\"#ffffff\" stop-opacity=\".04\"/><stop offset=\"1\" stop-color=\"#000000\" stop-opacity=\".10\"/></linearGradient><filter id=\"ky-shadow\" x=\"-20%\" y=\"-20%\" width=\"140%\" height=\"150%\"><feDropShadow dx=\"0\" dy=\"1.5\" stdDeviation=\"1.3\" flood-opacity=\".22\"/></filter><clipPath id=\"ky-clip\"><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\"/></clipPath></defs><g filter=\"url(#ky-shadow)\" clip-path=\"url(#ky-clip)\"><rect x=\"0\" y=\"0\" width=\"64\" height=\"48\" fill=\"#E21F26\"/><circle cx=\"32\" cy=\"24\" r=\"9\" fill=\"#FFD200\"/><circle cx=\"32\" cy=\"24\" r=\"5.5\" fill=\"#E21F26\"/><polygon points=\"32,17 33.5,22 39,22 34.5,25 36,30 32,27 28,30 29.5,25 25,22 30.5,22\" fill=\"#FFD200\"/><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"url(#ky-shine)\"/></g><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"none\" stroke=\"#000\" stroke-opacity=\".10\"/></svg>", "ru": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"64\" height=\"48\" viewBox=\"0 0 64 48\"><defs><linearGradient id=\"ru-shine\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#ffffff\" stop-opacity=\".22\"/><stop offset=\".45\" stop-color=\"#ffffff\" stop-opacity=\".04\"/><stop offset=\"1\" stop-color=\"#000000\" stop-opacity=\".10\"/></linearGradient><filter id=\"ru-shadow\" x=\"-20%\" y=\"-20%\" width=\"140%\" height=\"150%\"><feDropShadow dx=\"0\" dy=\"1.5\" stdDeviation=\"1.3\" flood-opacity=\".22\"/></filter><clipPath id=\"ru-clip\"><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\"/></clipPath></defs><g filter=\"url(#ru-shadow)\" clip-path=\"url(#ru-clip)\"><rect x=\"0\" y=\"0\" width=\"64\" height=\"16\" fill=\"#fff\"/><rect x=\"0\" y=\"16\" width=\"64\" height=\"16\" fill=\"#0039A6\"/><rect x=\"0\" y=\"32\" width=\"64\" height=\"16\" fill=\"#D52B1E\"/><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"url(#ru-shine)\"/></g><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"none\" stroke=\"#000\" stroke-opacity=\".10\"/></svg>", "sw": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"64\" height=\"48\" viewBox=\"0 0 64 48\"><defs><linearGradient id=\"sw-shine\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#ffffff\" stop-opacity=\".22\"/><stop offset=\".45\" stop-color=\"#ffffff\" stop-opacity=\".04\"/><stop offset=\"1\" stop-color=\"#000000\" stop-opacity=\".10\"/></linearGradient><filter id=\"sw-shadow\" x=\"-20%\" y=\"-20%\" width=\"140%\" height=\"150%\"><feDropShadow dx=\"0\" dy=\"1.5\" stdDeviation=\"1.3\" flood-opacity=\".22\"/></filter><clipPath id=\"sw-clip\"><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\"/></clipPath></defs><g filter=\"url(#sw-shadow)\" clip-path=\"url(#sw-clip)\"><polygon points=\"0,0 64,0 0,48\" fill=\"#1EB53A\"/><polygon points=\"64,0 64,48 0,48\" fill=\"#00A3DD\"/><polygon points=\"0,0 64,48 64,42 0,0\" fill=\"#FCD116\"/><polygon points=\"0,6 64,48 64,40 0,0\" fill=\"#000\"/><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"url(#sw-shine)\"/></g><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"none\" stroke=\"#000\" stroke-opacity=\".10\"/></svg>", "tg": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"64\" height=\"48\" viewBox=\"0 0 64 48\"><defs><linearGradient id=\"tg-shine\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#ffffff\" stop-opacity=\".22\"/><stop offset=\".45\" stop-color=\"#ffffff\" stop-opacity=\".04\"/><stop offset=\"1\" stop-color=\"#000000\" stop-opacity=\".10\"/></linearGradient><filter id=\"tg-shadow\" x=\"-20%\" y=\"-20%\" width=\"140%\" height=\"150%\"><feDropShadow dx=\"0\" dy=\"1.5\" stdDeviation=\"1.3\" flood-opacity=\".22\"/></filter><clipPath id=\"tg-clip\"><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\"/></clipPath></defs><g filter=\"url(#tg-shadow)\" clip-path=\"url(#tg-clip)\"><rect x=\"0\" y=\"0\" width=\"64\" height=\"16\" fill=\"#C8102E\"/><rect x=\"0\" y=\"16\" width=\"64\" height=\"16\" fill=\"#fff\"/><rect x=\"0\" y=\"32\" width=\"64\" height=\"16\" fill=\"#006B3F\"/><circle cx=\"32\" cy=\"24\" r=\"5\" fill=\"#F8D24A\"/><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"url(#tg-shine)\"/></g><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"none\" stroke=\"#000\" stroke-opacity=\".10\"/></svg>", "tr": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"64\" height=\"48\" viewBox=\"0 0 64 48\"><defs><linearGradient id=\"tr-shine\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#ffffff\" stop-opacity=\".22\"/><stop offset=\".45\" stop-color=\"#ffffff\" stop-opacity=\".04\"/><stop offset=\"1\" stop-color=\"#000000\" stop-opacity=\".10\"/></linearGradient><filter id=\"tr-shadow\" x=\"-20%\" y=\"-20%\" width=\"140%\" height=\"150%\"><feDropShadow dx=\"0\" dy=\"1.5\" stdDeviation=\"1.3\" flood-opacity=\".22\"/></filter><clipPath id=\"tr-clip\"><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\"/></clipPath></defs><g filter=\"url(#tr-shadow)\" clip-path=\"url(#tr-clip)\"><rect x=\"0\" y=\"0\" width=\"64\" height=\"48\" fill=\"#E30A17\"/><circle cx=\"25\" cy=\"24\" r=\"9\" fill=\"#fff\"/><circle cx=\"29\" cy=\"24\" r=\"7\" fill=\"#E30A17\"/><polygon points=\"35,17 36.8,22.1 42,22.1 37.8,25.1 39.4,30 35,27 30.6,30 32.2,25.1 28,22.1 33.2,22.1\" fill=\"#fff\"/><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"url(#tr-shine)\"/></g><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"none\" stroke=\"#000\" stroke-opacity=\".10\"/></svg>", "uz": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"64\" height=\"48\" viewBox=\"0 0 64 48\"><defs><linearGradient id=\"uz-shine\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#ffffff\" stop-opacity=\".22\"/><stop offset=\".45\" stop-color=\"#ffffff\" stop-opacity=\".04\"/><stop offset=\"1\" stop-color=\"#000000\" stop-opacity=\".10\"/></linearGradient><filter id=\"uz-shadow\" x=\"-20%\" y=\"-20%\" width=\"140%\" height=\"150%\"><feDropShadow dx=\"0\" dy=\"1.5\" stdDeviation=\"1.3\" flood-opacity=\".22\"/></filter><clipPath id=\"uz-clip\"><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\"/></clipPath></defs><g filter=\"url(#uz-shadow)\" clip-path=\"url(#uz-clip)\"><rect x=\"0\" y=\"0\" width=\"64\" height=\"10\" fill=\"#0099B5\"/><rect x=\"0\" y=\"10\" width=\"64\" height=\"2\" fill=\"#CE1126\"/><rect x=\"0\" y=\"12\" width=\"64\" height=\"12\" fill=\"#fff\"/><rect x=\"0\" y=\"24\" width=\"64\" height=\"2\" fill=\"#CE1126\"/><rect x=\"0\" y=\"26\" width=\"64\" height=\"22\" fill=\"#1EB53A\"/><circle cx=\"8\" cy=\"6\" r=\"3.3\" fill=\"#fff\"/><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"url(#uz-shine)\"/></g><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"none\" stroke=\"#000\" stroke-opacity=\".10\"/></svg>", "zh": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"64\" height=\"48\" viewBox=\"0 0 64 48\"><defs><linearGradient id=\"zh-shine\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#ffffff\" stop-opacity=\".22\"/><stop offset=\".45\" stop-color=\"#ffffff\" stop-opacity=\".04\"/><stop offset=\"1\" stop-color=\"#000000\" stop-opacity=\".10\"/></linearGradient><filter id=\"zh-shadow\" x=\"-20%\" y=\"-20%\" width=\"140%\" height=\"150%\"><feDropShadow dx=\"0\" dy=\"1.5\" stdDeviation=\"1.3\" flood-opacity=\".22\"/></filter><clipPath id=\"zh-clip\"><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\"/></clipPath></defs><g filter=\"url(#zh-shadow)\" clip-path=\"url(#zh-clip)\"><rect x=\"0\" y=\"0\" width=\"64\" height=\"48\" fill=\"#DE2910\"/><circle cx=\"11\" cy=\"10\" r=\"5\" fill=\"#DE2910\"/><polygon points=\"18,3.5 18.8,5.3 20.7,5.3 19.2,6.5 19.8,8.5 18,7.3 16.2,8.5 16.8,6.5 15.3,5.3 17.2,5.3\" fill=\"#DE2910\"/><polygon points=\"20,8.5 20.8,10.3 22.7,10.3 21.2,11.5 21.8,13.5 20,12.3 18.2,13.5 18.8,11.5 17.3,10.3 19.2,10.3\" fill=\"#DE2910\"/><polygon points=\"20,14.5 20.8,16.3 22.7,16.3 21.2,17.5 21.8,19.5 20,18.3 18.2,19.5 18.8,17.5 17.3,16.3 19.2,16.3\" fill=\"#DE2910\"/><polygon points=\"15,18.5 15.8,20.3 17.7,20.3 16.2,21.5 16.8,23.5 15,22.3 13.2,23.5 13.8,21.5 12.3,20.3 14.2,20.3\" fill=\"#DE2910\"/><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"url(#zh-shine)\"/></g><rect x=\"1\" y=\"1\" width=\"62\" height=\"46\" rx=\"9\" fill=\"none\" stroke=\"#000\" stroke-opacity=\".10\"/></svg>"};
  var RU_NAMES = { ky: 'Киргизский', zh_Hans: 'Китайский (упрощённый)', zh_Hant: 'Китайский (традиционный)', en_US: 'Английский (США)', en_GB: 'Английский (Великобритания)' };
  var WL_NAMES = {};
  var displayNames = null;
  try { displayNames = new Intl.DisplayNames(['ru'], { type: 'language' }); } catch (e) {}
  function langName(code) {
    if (RU_NAMES[code]) return RU_NAMES[code];
    var wl = WL_NAMES[code] || code;
    if (/generated/i.test(wl)) return wl;
    try {
      var n = displayNames && displayNames.of(code.replace(/_/g, '-'));
      if (n && n.toLowerCase() !== code.toLowerCase().replace(/_/g, '-')) return n[0].toUpperCase() + n.slice(1);
    } catch (e) {}
    return wl;
  }
  function flag(code) {
    var svg = FLAGS[code] || FLAGS[code.toLowerCase().split(/[_\-@]/)[0]];
    var box = document.createElement('span');
    box.className = 'flag';
    if (svg) {
      try {
        var doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
        box.appendChild(document.importNode(doc.documentElement, true));
      } catch (e) {}
    }
    return box;
  }
  function langLabel(code) {
    var s = document.createElement('span');
    s.className = 'lang';
    s.appendChild(flag(code));
    s.appendChild(document.createTextNode(langName(code)));
    return s;
  }

  /* ---------- storage ---------- */
  function sget(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function sset(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  /* ---------- HTTP ---------- */
  function http(url, asText) {
    return fetch(url, { credentials: 'same-origin', headers: { 'Accept': asText ? '*/*' : 'application/json' } })
      .then(function (r) {
        if (!r.ok) {
          return r.text().then(function (t) {
            var err = new Error('HTTP ' + r.status + ' ' + url + (t ? ': ' + t.slice(0, 200) : ''));
            err.status = r.status;
            throw err;
          });
        }
        return asText ? r.text() : r.json();
      });
  }
  function paginate(url) {
    var out = [];
    function step(u) {
      return http(u).then(function (d) {
        out = out.concat(d.results || []);
        if (d.next) {
          var n = new URL(d.next, location.origin);
          return step(n.pathname + n.search);
        }
        return out;
      });
    }
    return step(url);
  }
  /* ---------- компоненты, в т.ч. внутри категорий: c = «категория/компонент» ---------- */
  var COMP_API = {}, TR_API = {}, PROJECT_COMPS = {};
  function pathOf(u) {
    try { var x = new URL(u, location.origin).pathname; return x.slice(-1) === '/' ? x : x + '/'; } catch (e) { return null; }
  }
  function compApi(p, c) { return COMP_API[p + '/' + c] || '/api/components/' + p + '/' + c.split('/').join('%252F') + '/'; }
  function trApi(p, c, lang) { return TR_API[p + '/' + c + '/' + lang] || '/api/translations/' + p + '/' + c.split('/').join('%252F') + '/' + lang + '/'; }
  function fileKey(c) { return c.split('/').join('__'); }
  function projectComponents(p) {
    if (!PROJECT_COMPS[p]) {
      PROJECT_COMPS[p] = paginate('/api/projects/' + p + '/components/?page_size=1000').then(function (list) {
        return list.map(function (x) {
          var web = x.web_url ? pathOf(x.web_url) : null, pre = '/projects/' + p + '/';
          var c = web && web.indexOf(pre) === 0 ? decodeURIComponent(web.slice(pre.length, -1)) : x.slug;
          if (x.url) COMP_API[p + '/' + c] = pathOf(x.url);
          return { p: p, c: c, glossary: !!x.is_glossary };
        });
      });
      PROJECT_COMPS[p].catch(function () { delete PROJECT_COMPS[p]; });
    }
    return PROJECT_COMPS[p];
  }
  function translations(p, c) {
    return paginate(compApi(p, c) + 'translations/').then(function (trs) {
      trs.forEach(function (t) {
        WL_NAMES[t.language.code] = t.language.name;
        if (t.url) TR_API[p + '/' + c + '/' + t.language.code] = pathOf(t.url);
      });
      return trs;
    });
  }
  function downloadPo(p, c, lang, q) {
    var qs = '?format=po&q=' + encodeURIComponent(q);
    return http(trApi(p, c, lang) + 'file/' + qs, true)
      .catch(function (e) {
        return http('/download/' + p + '/' + c + '/' + lang + '/' + qs, true).catch(function () { throw e; });
      });
  }

  /* ---------- ссылки ---------- */
  function parseLinks(text) {
    var seen = {}, out = [];
    var re = /\/projects\/([^\s#?"'<>]+)/g, m;
    while ((m = re.exec(text))) {
      var segs = m[1].split('/').filter(Boolean).map(function (x) { try { return decodeURIComponent(x); } catch (e) { return x; } });
      if (!segs.length || seen[segs.join('/')]) continue;
      seen[segs.join('/')] = 1;
      out.push({ p: segs[0], segs: segs.slice(1), text: segs.join('/') });
    }
    return out;
  }
  /* ссылка → компоненты: на компонент, на категорию (все компоненты в ней) или на проект (все) */
  function resolveLinks(text) {
    var list = parseLinks(text), out = [], seen = {}, missing = [];
    function add(p, c) { if (!seen[p + '/' + c]) { seen[p + '/' + c] = 1; out.push({ p: p, c: c }); } }
    return Promise.all(list.map(function (l) {
      return projectComponents(l.p).then(function (all) { return { l: l, all: all }; }, function () { return { l: l, all: null }; });
    })).then(function (rs) {
      rs.forEach(function (r) {
        var l = r.l, before = out.length;
        if (!r.all) { if (l.segs.length) add(l.p, l.segs[0]); else missing.push(l.text); return; }
        var known = {};
        r.all.forEach(function (x) { known[x.c] = 1; });
        for (var k = l.segs.length; k > 0; k--) {
          var path = l.segs.slice(0, k).join('/');
          if (known[path]) { add(l.p, path); return; }
        }
        var prefix = l.segs.length ? l.segs.join('/') + '/' : '';
        r.all.forEach(function (x) { if (!x.glossary && x.c.indexOf(prefix) === 0) add(l.p, x.c); });
        if (out.length === before) missing.push(l.text);
      });
      return { comps: out, missing: missing };
    });
  }
  function baseLang(code) { return code.toLowerCase().split(/[_\-@]/)[0]; }
  function matchLanguage(wanted, trs) {
    var codes = trs.map(function (t) { return t.language.code; });
    if (codes.indexOf(wanted) >= 0) return wanted;
    var same = codes.filter(function (c) { return baseLang(c) === baseLang(wanted); });
    return same.length === 1 ? same[0] : null;
  }

  /* ---------- сообщение бота: языки, ключи, номер задачи ---------- */
  function normKey(line) { return line.replace(/\s+/g, ''); }
  function isKey(k) { return /^[A-Za-z_$][\w$-]*(\.[\w$-]+)+$/.test(k); }
  function parseTask(text) {
    var lines = text.split(/\r?\n/).map(function (l) { return l.replace(/^[\s•·*\-–—]+/, '').trim(); });
    var keys = [], langs = [], start = -1;
    lines.forEach(function (l, i) { if (start < 0 && /^ключи\s*:?\s*$/i.test(l)) start = i; });
    if (start >= 0) {
      for (var i = start + 1; i < lines.length; i++) {
        var l = lines[i];
        if (!l) continue;
        if (/:|@|https?:/.test(l)) break;
        if (isKey(normKey(l))) keys.push(normKey(l));
      }
    } else {
      lines.forEach(function (l) { if (!/:|@|\//.test(l) && isKey(normKey(l))) keys.push(normKey(l)); });
    }
    lines.forEach(function (l) {
      var m = /^языки\s*:\s*(.+)$/i.exec(l);
      if (!m) return;
      m[1].split(',').forEach(function (part) {
        var name = part.replace(/\([^)]*\)/g, '').replace(/[-–—]\s*\d[\d\s]*$/, '').trim().toLowerCase();
        if (name) langs.push(name);
      });
    });
    var t = /\/([A-Z][A-Z0-9]+-\d+)(?:[\/\s?#]|$)/.exec(text) || /\b([A-Z][A-Z0-9]+-\d+)\b/.exec(text);
    var field = function (re) { for (var i = 0; i < lines.length; i++) { var m = re.exec(lines[i]); if (m) return m[1].trim(); } return ''; };
    var taskLine = field(/^задача\s*:\s*(.+)$/i), url = /https?:\/\/\S+/.exec(taskLine);
    return {
      keys: keys.filter(function (k, i) { return keys.indexOf(k) === i; }), langs: langs, task: t ? t[1] : '',
      taskUrl: url ? url[0] : '', team: field(/^команда\s*:\s*(.+)$/i),
      deadline: field(/(?:срок|дедлайн|deadline)\s*:?\s*(\d{1,2}[.\/]\d{1,2}(?:[.\/]\d{2,4})?)/i)
    };
  }
  function keyFilter(keys) {
    var set = {}, found = {};
    keys.forEach(function (k) { set[k] = 1; });
    return {
      found: found,
      match: function (ctx) { if (ctx && set[ctx]) { found[ctx] = 1; return true; } return false; },
      matchPlural: function (ctx) {
        var hit = false;
        keys.forEach(function (k) { if (k === ctx || k.indexOf(ctx + '_') === 0) { found[k] = 1; hit = true; } });
        return hit;
      },
      missing: function () { return keys.filter(function (k) { return !found[k]; }); }
    };
  }

  /* ---------- трекер задач: Google Таблица через Apps Script (tracker/Code.gs) ---------- */
  var TRACKER_DEFAULT = {};
  function trCfg() {
    return {
      url: sget('wlx_tr_url') || TRACKER_DEFAULT.url || '',
      token: sget('wlx_tr_token') || TRACKER_DEFAULT.token || '',
      who: sget('wlx_tr_who') || ''
    };
  }
  function trRequest(method, url, body) {
    var ext = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id && chrome.runtime.sendMessage;
    var p = ext ? new Promise(function (resolve, reject) {
      chrome.runtime.sendMessage({ type: 'wlx-tracker', method: method, url: url, body: body }, function (r) {
        if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
        if (!r || !r.ok) return reject(new Error((r && r.error) || 'нет ответа'));
        resolve(r.text);
      });
    }) : fetch(url, method === 'POST' ? { method: 'POST', body: body, headers: { 'Content-Type': 'text/plain;charset=utf-8' } } : {})
      .then(function (r) { return r.text(); });
    return p.then(function (t) {
      var j;
      try { j = JSON.parse(t); } catch (e) { throw new Error('таблица ответила не JSON — проверь ссылку и доступ «Все»: ' + String(t).slice(0, 120)); }
      if (!j.ok) throw new Error(j.error || 'ошибка таблицы');
      return j;
    }, function (e) {
      throw new Error(ext ? String(e.message || e) : 'из закладки таблица может быть недоступна (защита Weblate) — используй расширение. ' + (e.message || e));
    });
  }
  function trGet(params) {
    var c = trCfg(), q = Object.keys(params).map(function (k) { return k + '=' + encodeURIComponent(params[k]); }).join('&');
    return trRequest('GET', c.url + (c.url.indexOf('?') < 0 ? '?' : '&') + 'token=' + encodeURIComponent(c.token) + (q ? '&' + q : ''));
  }
  function trPost(body) { body.token = trCfg().token; return trRequest('POST', trCfg().url, JSON.stringify(body)); }
  var TRANSLATORS = null;
  function loadTranslators() {
    if (!TRANSLATORS) TRANSLATORS = trGet({ action: 'translators' }).then(function (j) { return j.translators || []; }, function () { TRANSLATORS = null; return []; });
    return TRANSLATORS;
  }

  /* ---------- PO filter: keep header + empty / fuzzy entries ---------- */
  function unquote(s) {
    s = s.trim();
    return s.length >= 2 && s[0] === '"' && s[s.length - 1] === '"' ? s.slice(1, -1) : s;
  }
  function wordCount(s) {
    s = s.replace(/\\n|\\t/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\{\{?[^}]*\}\}?|%\w/g, ' ');
    var m = s.match(/[\p{L}\p{N}_]+/gu);
    return m ? m.length : 0;
  }
  function poEntries(text) {
    var out = [];
    text.replace(/\r\n/g, '\n').split(/\n\s*\n/).forEach(function (b) {
      var lines = b.split('\n').filter(function (l) { return l.trim() !== ''; });
      if (!lines.length) return;
      var fuzzy = lines.some(function (l) { return l.indexOf('#,') === 0 && l.indexOf('fuzzy') >= 0; });
      var obsolete = lines.every(function (l) { return l[0] === '#'; }) && lines.some(function (l) { return l.indexOf('#~') === 0; });
      var f = {}, key = null;
      lines.forEach(function (l) {
        if (l[0] === '#') return;
        var m = /^(msgctxt|msgid_plural|msgid|msgstr(?:\[\d+\])?)\s+(".*")\s*$/.exec(l);
        if (m) { key = m[1]; f[key] = unquote(m[2]); }
        else if (l.trim()[0] === '"' && key) { f[key] += unquote(l); }
      });
      if (f.msgid === undefined) return;
      var strs = Object.keys(f).filter(function (k) { return k.indexOf('msgstr') === 0; }).map(function (k) { return f[k]; });
      out.push({
        lines: lines, fuzzy: fuzzy, obsolete: obsolete, msgid: f.msgid, plural: f.msgid_plural || '', strs: strs, ctx: f.msgctxt,
        header: f.msgid === '' && !f.msgid_plural,
        done: !!strs.length && strs.every(function (x) { return x !== ''; }) && !fuzzy
      });
    });
    return out;
  }
  function filterPo(text, dropPlurals, kf) {
    var keep = [], n = 0, words = 0, plurals = 0;
    poEntries(text).forEach(function (e) {
      if (e.header) { keep.push(e.lines.join('\n')); return; }
      if (e.obsolete || e.done) return;
      if (kf && !kf.match(e.ctx || e.msgid)) return;
      if (e.plural) { plurals++; if (dropPlurals) return; }
      keep.push(e.lines.join('\n'));
      n++;
      words += wordCount(e.msgid) + wordCount(e.plural);
    });
    return { text: keep.join('\n\n') + '\n', strings: n, words: words, plurals: plurals };
  }

  /* ---------- плюралки → i18next JSON ---------- */
  var CAT_ORDER = ['zero', 'one', 'two', 'few', 'many', 'other'];
  function pluralCats(code) {
    try {
      var c = new Intl.PluralRules(code.replace(/_/g, '-')).resolvedOptions().pluralCategories;
      return CAT_ORDER.filter(function (x) { return c.indexOf(x) >= 0; });
    } catch (e) { return ['one', 'other']; }
  }
  /* подогнать категории CLDR под число форм в Weblate (у русского в Weblate 3 формы без other) */
  function fitCats(cats, n) {
    cats = cats.slice();
    if (cats.length > n && cats.indexOf('other') >= 0) cats.splice(cats.indexOf('other'), 1);
    return cats.length === n ? cats : null;
  }
  var FORMATS = {};
  function componentFormat(p, c) {
    var k = p + '/' + c;
    if (!FORMATS[k]) FORMATS[k] = http(compApi(p, c)).then(function (d) { return d.file_format || ''; }, function () { return ''; });
    return FORMATS[k];
  }
  function units(p, c, lang, q) {
    return paginate(trApi(p, c, lang) + 'units/?q=' + encodeURIComponent(q));
  }
  function pluralSuffixes(fmt, code, n) {
    var idx = [];
    for (var i = 0; i < n; i++) idx.push('_' + i);
    if (fmt === 'i18next') return n === 2 ? ['', '_plural'] : idx;
    var cats = fitCats(pluralCats(code), n);
    return cats ? cats.map(function (c) { return '_' + c; }) : idx;
  }
  /* непереведённые плюралки → { "ключ_one": "…", "ключ_other": "…" }; где перевода нет — русский исходник нужной формы */
  function pluralJson(list, fmt, srcCode, tgtCode, kf) {
    var out = {}, strings = 0, words = 0;
    list.forEach(function (u) {
      if (!u.source || u.source.length < 2 || u.state >= 20 || !u.context) return;
      if (kf && !kf.matchPlural(u.context)) return;
      var n = u.target && u.target.length > 1 ? u.target.length : pluralCats(tgtCode).length;
      var sufs = pluralSuffixes(fmt, tgtCode, n);
      var tgtCats = fitCats(pluralCats(tgtCode), n);
      var srcCats = fitCats(pluralCats(srcCode), u.source.length);
      sufs.forEach(function (suf, i) {
        var val = u.target && u.target[i];
        if (!val) {
          var j = Math.min(i, u.source.length - 1);
          if (tgtCats && srcCats) {
            var cat = tgtCats[i];
            j = srcCats.indexOf(cat);
            if (j < 0) j = srcCats.indexOf('many') >= 0 ? srcCats.indexOf('many') : u.source.length - 1;
          }
          val = u.source[j];
        }
        out[u.context + suf] = val;
      });
      strings++;
      words += u.num_words || wordCount(u.source[0]);
    });
    return { text: JSON.stringify(out, null, 2) + '\n', strings: strings, words: words };
  }
  function poInfo(text) {
    var headers = {}, filled = 0, total = 0;
    poEntries(text).forEach(function (e) {
      if (e.header) {
        e.strs.join('').split('\\n').forEach(function (l) {
          var i = l.indexOf(':');
          if (i > 0) headers[l.slice(0, i).trim()] = l.slice(i + 1).trim();
        });
        return;
      }
      if (e.obsolete) return;
      total++;
      if (e.done) filled++;
    });
    return { headers: headers, filled: filled, total: total };
  }

  /* ---------- ZIP (store, UTF-8 names) ---------- */
  var CRC = (function () {
    var t = [], c, n, k;
    for (n = 0; n < 256; n++) { c = n; for (k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
    return t;
  })();
  function crc32(buf) {
    var c = 0xFFFFFFFF;
    for (var i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }
  function makeZip(files) {
    var enc = new TextEncoder(), parts = [], central = [], offset = 0;
    var d = new Date();
    var dosTime = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
    var dosDate = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    files.forEach(function (f) {
      var name = enc.encode(f.name), data = enc.encode(f.text), crc = crc32(data);
      var h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true);
      h.setUint16(8, 0, true); h.setUint16(10, dosTime, true); h.setUint16(12, dosDate, true);
      h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true);
      h.setUint16(26, name.length, true); h.setUint16(28, 0, true);
      parts.push(h.buffer, name, data);
      var cd = new DataView(new ArrayBuffer(46));
      cd.setUint32(0, 0x02014b50, true); cd.setUint16(4, 20, true); cd.setUint16(6, 20, true);
      cd.setUint16(8, 0x0800, true); cd.setUint16(10, 0, true); cd.setUint16(12, dosTime, true);
      cd.setUint16(14, dosDate, true); cd.setUint32(16, crc, true); cd.setUint32(20, data.length, true);
      cd.setUint32(24, data.length, true); cd.setUint16(28, name.length, true);
      cd.setUint32(42, offset, true);
      central.push(cd.buffer, name);
      offset += 30 + name.length + data.length;
    });
    var cdSize = central.reduce(function (s, p) { return s + p.byteLength; }, 0);
    var end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
    end.setUint32(12, cdSize, true); end.setUint32(16, offset, true);
    return new Blob(parts.concat(central, [end.buffer]), { type: 'application/zip' });
  }
  function saveBlob(blob, name) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
  }

  /* ---------- ZIP read (stored / deflate) ---------- */
  function readZip(buf) {
    var dv = new DataView(buf), u8 = new Uint8Array(buf), dec = new TextDecoder('utf-8'), eocd = -1;
    for (var i = buf.byteLength - 22; i >= 0; i--) { if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; } }
    if (eocd < 0) return Promise.reject(new Error('не похоже на zip-архив'));
    var count = dv.getUint16(eocd + 10, true), p = dv.getUint32(eocd + 16, true), jobs = [];
    for (var k = 0; k < count; k++) {
      var method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true);
      var nlen = dv.getUint16(p + 28, true), xlen = dv.getUint16(p + 30, true), clen = dv.getUint16(p + 32, true);
      var loc = dv.getUint32(p + 42, true);
      var name = dec.decode(u8.subarray(p + 46, p + 46 + nlen));
      var start = loc + 30 + dv.getUint16(loc + 26, true) + dv.getUint16(loc + 28, true);
      var data = u8.slice(start, start + csize);
      p += 46 + nlen + xlen + clen;
      if (/\/$/.test(name) || /__MACOSX/.test(name) || !/\.(po|json)$/i.test(name)) continue;
      jobs.push((function (name, method, data) {
        var bytes = method === 0 ? Promise.resolve(data.buffer)
          : new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer();
        return bytes.then(function (b) { return { name: name, text: dec.decode(b) }; });
      })(name, method, data));
    }
    return Promise.all(jobs);
  }

  /* ---------- upload ---------- */
  function csrfToken() {
    var i = document.querySelector('input[name=csrfmiddlewaretoken]');
    if (i && i.value) return Promise.resolve(i.value);
    var m = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/);
    if (m) return Promise.resolve(decodeURIComponent(m[1]));
    return fetch('/', { credentials: 'same-origin' }).then(function (r) { return r.text(); }).then(function (t) {
      var m2 = /name="csrfmiddlewaretoken"\s+value="([^"]+)"/.exec(t);
      if (!m2) throw new Error('Не нашла CSRF-токен — открой любую страницу Weblate и попробуй ещё раз');
      return m2[1];
    });
  }
  function uploadPo(u, opts, token) {
    function form(api) {
      var fd = new FormData();
      var isJson = /\.json$/i.test(u.name);
      fd.append('file', new Blob([u.text], { type: isJson ? 'application/json' : 'text/x-gettext-translation' }), u.name.split('/').pop());
      fd.append('method', opts.method); fd.append('fuzzy', opts.fuzzy); fd.append('conflicts', opts.conflicts);
      if (!api) fd.append('csrfmiddlewaretoken', token);
      return fd;
    }
    var path = u.p + '/' + u.c + '/' + u.lang + '/';
    return fetch(trApi(u.p, u.c, u.lang) + 'file/', {
      method: 'POST', credentials: 'same-origin', body: form(true),
      headers: { 'X-CSRFToken': token, 'Accept': 'application/json' }
    }).then(function (r) {
      return r.text().then(function (t) {
        if (r.ok) { try { return JSON.parse(t); } catch (e) { return { result: true }; } }
        if (r.status === 403 || r.status === 405) {
          return fetch('/upload/' + path, { method: 'POST', credentials: 'same-origin', body: form(false) }).then(function (r2) {
            if (!r2.ok) throw new Error('HTTP ' + r2.status + ': ' + t.slice(0, 200));
            return { viaForm: true };
          });
        }
        throw new Error('HTTP ' + r.status + ': ' + t.slice(0, 300));
      });
    });
  }

  /* ---------- UI ---------- */
  var CSS = [
    ':host{all:initial}',
    '.back{position:fixed;inset:0;background:rgba(15,20,30,.45);z-index:2147483646;display:flex;align-items:flex-start;justify-content:center;overflow:auto;padding:24px 12px}',
    '.box{background:#fff;color:#1d2330;width:100%;max-width:760px;border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,.3);padding:22px 22px 26px;font:14px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}',
    '.top{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}',
    'h1{font-size:19px;margin:0}',
    '.x{background:none;border:0;font-size:24px;line-height:1;cursor:pointer;color:#6b7385;padding:4px 8px}',
    '.sub{color:#6b7385;margin:0 0 14px;font-size:13px}',
    'h2{font-size:14px;margin:18px 0 8px}',
    'textarea{width:100%;box-sizing:border-box;min-height:140px;padding:9px 11px;border:1px solid #d9dde5;border-radius:8px;font:12.5px/1.5 Consolas,ui-monospace,monospace;resize:vertical;color:#1d2330;background:#fff}',
    '.row{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-top:10px}',
    'button.b{font:inherit;border:0;border-radius:8px;padding:9px 16px;cursor:pointer;background:#1b8a6b;color:#fff;font-weight:600}',
    'button.g{background:#e8f5f0;color:#1b8a6b}',
    'button.s{padding:5px 11px;font-size:13px}',
    'button.big{font-size:16px;padding:12px 26px}',
    'button:disabled{opacity:.5;cursor:default}',
    '.langs{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:2px;margin-top:8px}',
    '.langs label{display:flex;gap:7px;align-items:center;padding:5px 7px;border-radius:6px;cursor:pointer}',
    '.langs label:hover{background:#f3f5f8}',
    '.muted{color:#6b7385;font-size:12.5px}',
    '.err{color:#c0392b;white-space:pre-wrap;margin-top:8px;font-size:13px}',
    '.bar{height:9px;background:#e3e6ec;border-radius:6px;overflow:hidden;margin:8px 0 12px}',
    '.bar>div{height:100%;width:0;background:#1b8a6b;transition:width .25s}',
    'table{width:100%;border-collapse:collapse;font-size:13.5px}',
    'th,td{text-align:left;padding:7px 5px;border-bottom:1px solid #eceef2}',
    'th{color:#6b7385;font-weight:500;font-size:12.5px}',
    '.n{text-align:right;font-variant-numeric:tabular-nums}',
    'details{margin-top:12px}summary{cursor:pointer;color:#6b7385;font-size:13px}',
    '.blk{display:block;margin-top:10px}',
    '.red{color:#c0392b}',
    '.tabs{display:flex;gap:6px;margin:6px 0 4px;border-bottom:1px solid #eceef2;padding-bottom:10px}',
    '.tab{font:inherit;border:0;border-radius:8px;padding:8px 14px;cursor:pointer;background:#f3f5f8;color:#1d2330;font-weight:600}',
    '.tab.on{background:#1b8a6b;color:#fff}',
    '.drop{display:block;border:2px dashed #cfd5de;border-radius:10px;padding:22px;text-align:center;cursor:pointer;color:#6b7385}',
    '.drop.over{border-color:#1b8a6b;background:#e8f5f0;color:#1b8a6b}',
    '.drop input{display:none}',
    '.opts{display:grid;grid-template-columns:1fr;gap:10px}',
    '.opts label{display:block;font-size:13px;color:#6b7385}',
    'select{display:block;width:100%;margin-top:4px;padding:8px 10px;border:1px solid #d9dde5;border-radius:8px;font:inherit;color:#1d2330;background:#fff}',
    '.ok{color:#1b8a6b}',
    '.flag{display:inline-block;width:24px;height:18px;flex:none;vertical-align:middle}',
    '.flag svg{width:24px;height:18px;display:block}',
    '.lang{display:inline-flex;align-items:center;gap:8px}',
    '.layouts{display:grid;gap:4px}',
    '.layouts label{display:flex;gap:8px;align-items:baseline;padding:5px 7px;border-radius:6px;cursor:pointer}',
    '.layouts label:hover{background:#f3f5f8}',
    '.complist{max-height:220px;overflow:auto;font:12.5px/1.6 Consolas,ui-monospace,monospace;color:#1d2330;padding:6px 0}',
    '.seg{display:flex;gap:6px;margin-bottom:8px}',
    '.seg button.on{background:#1b8a6b;color:#fff}',
    '.task{margin-top:12px;padding:10px 12px;border-radius:8px;background:#f3f5f8;font-size:13.5px}',
    '.settings{margin:6px 0 10px;padding:12px 14px;border-radius:10px;background:#f3f5f8}',
    '.settings label,.grid2 label{display:block;font-size:13px;color:#6b7385;margin-top:8px}',
    '.settings input,.grid2 input,.track td input{display:block;width:100%;box-sizing:border-box;margin-top:3px;padding:7px 9px;border:1px solid #d9dde5;border-radius:7px;font:inherit;color:#1d2330;background:#fff}',
    '.grid2{display:grid;grid-template-columns:1fr 1fr;gap:0 12px}',
    '.track{margin-top:18px;border-top:1px solid #eceef2;padding-top:4px}',
    '.hide{display:none}'
  ].join('\n');

  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'text') e.textContent = attrs[k];
      else if (k === 'class') e.className = attrs[k];
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), attrs[k]);
      else e.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (k) { if (k) e.appendChild(typeof k === 'string' ? document.createTextNode(k) : k); });
    return e;
  }

  var host = el('div', { id: 'wl-export-host' });
  var root = host.attachShadow({ mode: 'open' });
  try {
    var sheet = new CSSStyleSheet(); sheet.replaceSync(CSS); root.adoptedStyleSheets = [sheet];
  } catch (e) {
    root.appendChild(el('style', { text: CSS }));
  }

  var links = el('textarea', { placeholder: 'Вставь ссылки на компоненты, категории или проект — можно кусок сообщения из чата целиком' });
  var botArea = el('textarea', { placeholder: 'Вставь сообщение от бота целиком: ссылку, «Языки: …» и «ключи:» закладка найдёт сама' });
  var mode = sget('wlx_mode') === 'bot' ? 'bot' : 'links';
  var modeLinks = el('button', { class: 'b g s', text: 'Ссылки', onclick: function () { setMode('links'); } });
  var modeBot = el('button', { class: 'b g s', text: 'Задача от бота', onclick: function () { setMode('bot'); } });
  var onlyKeys = el('input', { type: 'checkbox' }); onlyKeys.checked = true;
  var taskBox = el('div', { class: 'task hide' });
  var currentTask = null, exportTag = '';
  function srcText() { return mode === 'bot' ? botArea.value : links.value; }
  var info = el('span', { class: 'muted' });
  var compList = el('div');
  var err1 = el('div', { class: 'err' });
  var langsBox = el('div', { class: 'langs' });
  var fuzzy = el('input', { type: 'checkbox' }); fuzzy.checked = true;
  var pluralsJson = el('input', { type: 'checkbox' });
  pluralsJson.checked = sget('wlx_pj') !== '0';
  pluralsJson.addEventListener('change', function () { sset('wlx_pj', pluralsJson.checked ? '1' : '0'); });
  var err2 = el('div', { class: 'err' });
  var progText = el('div', { class: 'muted' });
  var barFill = el('div');
  var results = el('div');
  var loadBtn = el('button', { class: 'b g', text: 'Загрузить языки', onclick: loadLangs });
  var goBtn = el('button', { class: 'b big', text: 'Выгрузить', onclick: runExport });
  var clearBtn = el('button', { class: 'b g s', text: 'Очистить', onclick: function () {
    (mode === 'bot' ? botArea : links).value = ''; (mode === 'bot' ? botArea : links).focus();
    info.textContent = ''; err1.textContent = ''; compList.textContent = ''; taskBox.classList.add('hide'); currentTask = null;
    langSec.classList.add('hide'); resSec.classList.add('hide');
  } });
  var restoreBtn = el('button', { class: 'b g s', text: 'Вернуть прошлые ссылки', onclick: function () {
    links.value = sget('wlx_links') || '';
  } });
  var LAYOUTS = [
    ['component', 'По компонентам', 'папка на каждый компонент: wb-web-resale/, wb-web-rqx/…'],
    ['language', 'По языкам', 'папка на каждый язык: Грузинский/, Казахский/…'],
    ['flat', 'Всё в одну папку', 'все файлы вместе, без подпапок']
  ];
  var layoutBox = el('div', { class: 'layouts' });
  var savedLayout = sget('wlx_layout') || 'component';
  LAYOUTS.forEach(function (l) {
    var r = el('input', { type: 'radio', name: 'wlx-layout', value: l[0] });
    r.checked = l[0] === savedLayout;
    r.addEventListener('change', function () { sset('wlx_layout', l[0]); });
    layoutBox.appendChild(el('label', {}, [r, el('span', {}, [el('b', { text: l[1] }), el('span', { class: 'muted', text: ' — ' + l[2] })])]));
  });
  function currentLayout() {
    var r = layoutBox.querySelector('input:checked');
    return r ? r.value : 'component';
  }
  var englishApart = el('input', { type: 'checkbox' });
  englishApart.checked = sget('wlx_en') !== '0';
  englishApart.addEventListener('change', function () { sset('wlx_en', englishApart.checked ? '1' : '0'); });
  var langSec = el('div', { class: 'hide' }, [
    el('h2', { text: '2. Языки' }),
    el('div', { class: 'row' }, [
      el('button', { class: 'b g s', text: 'Все', onclick: function () { setAll(true); } }),
      el('button', { class: 'b g s', text: 'Снять все', onclick: function () { setAll(false); } })
    ]),
    langsBox,
    el('label', { class: 'muted blk' }, [fuzzy, ' включать строки «требует правки»']),
    el('label', { class: 'muted blk' }, [pluralsJson, ' плюралки (множественное число) — отдельным .json, как у нас принято']),
    el('h2', { text: 'Как разложить файлы в архиве' }),
    layoutBox,
    el('label', { class: 'muted blk' }, [englishApart, ' английский всегда отдельно — в папку «Английский ШТАТ»']),
    el('div', { class: 'row' }, [goBtn]),
    err2
  ]);
  var resSec = el('div', { class: 'hide' }, [el('h2', { text: '3. Результат' }), progText, el('div', { class: 'bar' }, [barFill]), results]);

  var exportPane = el('div', {}, [
    el('p', { class: 'sub', text: 'Ссылки → языки → «Выгрузить». На выходе .po по каждому компоненту и языку, в архиве — как удобнее: по компонентам, по языкам или всё вместе.' }),
    el('h2', { text: '1. Что выгружаем' }),
    el('div', { class: 'seg' }, [modeLinks, modeBot]),
    links,
    botArea,
    el('div', { class: 'row' }, [loadBtn, clearBtn, restoreBtn, info]),
    err1,
    taskBox,
    compList,
    langSec,
    resSec
  ]);

  /* ----- import pane ----- */
  function select(options, value) {
    var sel = el('select');
    options.forEach(function (o) { sel.appendChild(el('option', { value: o[0], text: o[1] })); });
    sel.value = value;
    return sel;
  }
  function savedOr(k, def) { var v = sget(k); return v === null ? def : v; }
  var fileInput = el('input', { type: 'file', multiple: '', accept: '.po,.json,.zip' });
  var drop = el('label', { class: 'drop' }, [fileInput, el('div', { text: 'Перетащи сюда .po, .json (плюралки) или .zip от подрядчика — или нажми, чтобы выбрать' })]);
  var preview = el('div');
  var errU = el('div', { class: 'err' });
  var optMethod = select([['translate', 'Добавить как перевод'], ['suggest', 'Добавить как предложение'], ['fuzzy', 'Добавить перевод как «На правку»']], savedOr('wlx_m', 'translate'));
  var optFuzzy = select([['approve', 'Импортировать как переведённое'], ['process', 'Импортировать как «На правку»'], ['', 'Не импортировать']], savedOr('wlx_f', 'approve'));
  var optConf = select([['replace-approved', 'Изменять переведённые и одобренные строки'], ['replace-translated', 'Изменять переведённые строки'], ['', 'Изменять только непереведённые строки']], savedOr('wlx_c', 'replace-approved'));
  var upBtn = el('button', { class: 'b big', text: 'Загрузить в Weblate', onclick: runUpload });
  var upResults = el('div', { class: 'blk' });
  var upSec = el('div', { class: 'hide' }, [
    el('h2', { text: '2. Как загружать' }),
    el('div', { class: 'opts' }, [
      el('label', {}, ['Режим загрузки файла', optMethod]),
      el('label', {}, ['Обработка строк, отмеченных «На правку»', optFuzzy]),
      el('label', {}, ['Разрешение конфликтов', optConf])
    ]),
    el('p', { class: 'muted', text: '«Заменить существующий файл перевода» здесь нет специально: в файлах только часть строк, и замена стёрла бы остальные переводы.' }),
    el('div', { class: 'row' }, [upBtn]),
    upResults
  ]);
  var importPane = el('div', { class: 'hide' }, [
    el('p', { class: 'sub', text: 'Файлы → проверка → «Загрузить в Weblate». Компонент и язык определяются сами по заголовку файла.' }),
    el('h2', { text: '1. Файлы от подрядчика' }),
    drop, errU, preview, upSec
  ]);

  var tabExp = el('button', { class: 'tab on', text: '⬇ Выгрузить', onclick: function () { tab(true); } });
  var tabImp = el('button', { class: 'tab', text: '⬆ Загрузить обратно', onclick: function () { tab(false); } });
  function tab(exp) {
    tabExp.classList.toggle('on', exp); tabImp.classList.toggle('on', !exp);
    exportPane.classList.toggle('hide', !exp); importPane.classList.toggle('hide', exp);
  }

  /* ----- настройки таблицы задач ----- */
  var stUrl = el('input', { type: 'text', placeholder: 'https://script.google.com/macros/s/…/exec' });
  var stToken = el('input', { type: 'password', placeholder: 'токен из скрипта (TOKEN)' });
  var stWho = el('input', { type: 'text', placeholder: 'например: Настя Лисовая' });
  var stMsg = el('div', { class: 'muted' });
  function fillSettings() { var c = trCfg(); stUrl.value = c.url; stToken.value = c.token; stWho.value = c.who; }
  fillSettings();
  var settingsPane = el('div', { class: 'settings hide' }, [
    el('h2', { text: 'Таблица задач переводчиков (Google Таблица)' }),
    el('p', { class: 'muted', text: 'Если подключить, выгрузки можно записывать в общую таблицу, а загрузка обратно сама отмечает их выполненными. Как создать таблицу — tracker/README.md.' }),
    el('label', {}, ['Ссылка на веб-приложение', stUrl]),
    el('label', {}, ['Токен', stToken]),
    el('label', {}, ['Твоё имя (кто выгрузил / загрузил)', stWho]),
    el('div', { class: 'row' }, [
      el('button', { class: 'b s', text: 'Сохранить', onclick: function () {
        sset('wlx_tr_url', stUrl.value.trim()); sset('wlx_tr_token', stToken.value.trim()); sset('wlx_tr_who', stWho.value.trim());
        TRANSLATORS = null; stMsg.textContent = 'Сохранено';
      } }),
      el('button', { class: 'b g s', text: 'Проверить подключение', onclick: function () {
        sset('wlx_tr_url', stUrl.value.trim()); sset('wlx_tr_token', stToken.value.trim()); sset('wlx_tr_who', stWho.value.trim());
        TRANSLATORS = null; stMsg.textContent = 'Проверяю…';
        trGet({}).then(function (j) { stMsg.textContent = '✓ Подключено: таблица «' + (j.sheet || '') + '»'; },
          function (e) { stMsg.textContent = '✗ ' + (e.message || e); });
      } }),
      stMsg
    ])
  ]);

  var back = el('div', { class: 'back', onclick: function (e) { if (e.target === back) hide(); } }, [
    el('div', { class: 'box' }, [
      el('div', { class: 'top' }, [
        el('h1', { text: 'Weblate: выгрузка и загрузка переводов' }),
        el('div', {}, [
          el('button', { class: 'x', title: 'Таблица задач (настройки)', text: '⚙', onclick: function () { settingsPane.classList.toggle('hide'); } }),
          el('button', { class: 'x', title: 'Закрыть', text: '×', onclick: hide })
        ])
      ]),
      settingsPane,
      el('div', { class: 'tabs' }, [tabExp, tabImp]),
      exportPane,
      importPane
    ])
  ]);
  root.appendChild(back);

  function show() { host.style.display = ''; }
  function hide() { host.style.display = 'none'; }
  function setAll(v) { langsBox.querySelectorAll('input').forEach(function (i) { i.checked = v; }); }
  function friendly(e) {
    var m = String(e && e.message || e);
    if (/HTTP 40[13]/.test(m)) return 'Weblate не пускает. Проверь, что ты вошла в Weblate в этой вкладке, и нажми закладку ещё раз.\n\n' + m;
    if (/HTTP 404/.test(m)) return 'Не нашёлся компонент или язык — проверь ссылку.\n\n' + m;
    if (/Failed to fetch|NetworkError/.test(m)) return 'Нет связи с Weblate (VPN?).\n\n' + m;
    return m;
  }

  /* поле ссылок при открытии пустое; прошлые ссылки можно вернуть кнопкой */
  var saved = sget('wlx_links');
  function setMode(m) {
    mode = m; sset('wlx_mode', m);
    modeLinks.classList.toggle('on', m === 'links'); modeBot.classList.toggle('on', m === 'bot');
    links.classList.toggle('hide', m !== 'links'); botArea.classList.toggle('hide', m !== 'bot');
    restoreBtn.classList.toggle('hide', m !== 'links' || !sget('wlx_links'));
    taskBox.classList.add('hide'); err1.textContent = ''; info.textContent = ''; compList.textContent = '';
    langSec.classList.add('hide'); resSec.classList.add('hide');
  }
  setMode(mode);
  /* задача от бота: отметить её языки, показать ключи */
  function applyTask(t, langs) {
    var codes = Object.keys(langs), picked = [], unknown = [];
    t.langs.forEach(function (name) {
      var hit = codes.filter(function (c) {
        var n = langName(c).toLowerCase();
        return n === name || n.indexOf(name + ' (') === 0 || n.indexOf(name + ',') === 0;
      });
      if (hit.length) picked = picked.concat(hit); else unknown.push(name);
    });
    if (picked.length) langsBox.querySelectorAll('input').forEach(function (i) { i.checked = picked.indexOf(i.value) >= 0; });
    taskBox.textContent = '';
    taskBox.appendChild(el('div', {}, [el('b', { text: 'Из задачи' + (t.task ? ' ' + t.task : '') + ': ' }),
      el('span', { text: 'языков ' + picked.length + (t.langs.length ? ' из ' + t.langs.length : '') + ', ключей ' + t.keys.length })]));
    if (unknown.length) taskBox.appendChild(el('div', { class: 'red', text: 'Не нашла в компонентах языки: ' + unknown.join(', ') }));
    if (!t.langs.length) taskBox.appendChild(el('div', { class: 'muted', text: 'Строку «Языки: …» не нашла — отметь языки сама.' }));
    if (t.keys.length) {
      taskBox.appendChild(el('label', { class: 'blk' }, [onlyKeys, ' выгружать только эти ключи']));
      var kl = el('div', { class: 'complist' });
      t.keys.forEach(function (k) { kl.appendChild(el('div', { text: k })); });
      taskBox.appendChild(el('details', {}, [el('summary', { text: 'Ключи (' + t.keys.length + ')' }), kl]));
    } else {
      taskBox.appendChild(el('div', { class: 'muted', text: 'Список ключей не нашла — выгружу все непереведённые строки.' }));
    }
    taskBox.classList.remove('hide');
  }

  var comps = [];
  function loadLangs() {
    err1.textContent = ''; compList.textContent = '';
    var text = srcText();
    if (mode === 'links') sset('wlx_links', text);
    taskBox.classList.add('hide'); currentTask = mode === 'bot' ? parseTask(text) : null;
    if (!parseLinks(text).length) { err1.textContent = 'Не нашла ни одной ссылки вида …/projects/<проект>/…'; return; }
    loadBtn.disabled = true; info.textContent = 'Разбираю ссылки…';
    resolveLinks(text).then(function (r) {
      comps = r.comps;
      if (r.missing.length) err1.textContent = 'Не нашла компоненты по ссылкам:\n' + r.missing.join('\n');
      if (!comps.length) throw new Error('Не нашла ни одного компонента');
      sset('wlx_comps', JSON.stringify(comps));
      info.textContent = 'Нашла компонентов: ' + comps.length + '. Загружаю языки…';
      var all = [], done = 0;
      return pool(comps, 6, function (x) {
        return translations(x.p, x.c).then(function (trs) {
          all.push(trs); done++;
          info.textContent = 'Нашла компонентов: ' + comps.length + '. Загружаю языки… ' + done + ' из ' + comps.length;
        });
      }).then(function () { return all; });
    }).then(function (all) {
      var langs = {};
      all.forEach(function (trs) {
        trs.forEach(function (t) { if (!t.is_source) langs[t.language.code] = t.language.name; });
      });
      var prev = null;
      try { prev = JSON.parse(sget('wlx_langs') || 'null'); } catch (e) {}
      langsBox.textContent = '';
      Object.keys(langs).sort(function (a, b) { return langName(a).localeCompare(langName(b), 'ru'); }).forEach(function (code) {
        var cb = el('input', { type: 'checkbox', value: code });
        cb.checked = prev ? prev.indexOf(code) >= 0 : !/generated/i.test(langs[code]);
        langsBox.appendChild(el('label', { title: code }, [cb, langLabel(code)]));
      });
      if (currentTask) applyTask(currentTask, langs);
      info.textContent = 'Компонентов: ' + comps.length + (comps.length > 100 ? ' — много, выгрузка займёт время' : '');
      var ul = el('div', { class: 'complist' });
      comps.forEach(function (x) { ul.appendChild(el('div', { text: x.p + ' / ' + x.c })); });
      compList.appendChild(el('details', {}, [el('summary', { text: 'Какие компоненты нашлись (' + comps.length + ')' }), ul]));
      langSec.classList.remove('hide');
    }).catch(function (e) {
      err1.textContent = (err1.textContent ? err1.textContent + '\n\n' : '') + friendly(e); info.textContent = '';
    }).then(function () { loadBtn.disabled = false; });
  }

  function pool(items, size, fn) {
    var i = 0;
    function worker() { if (i >= items.length) return Promise.resolve(); var it = items[i++]; return fn(it).then(worker); }
    var ws = [];
    for (var k = 0; k < Math.min(size, items.length); k++) ws.push(worker());
    return Promise.all(ws);
  }

  function runExport() {
    err2.textContent = '';
    var langs = Array.prototype.map.call(langsBox.querySelectorAll('input:checked'), function (i) { return i.value; });
    if (!langs.length) { err2.textContent = 'Отметь хотя бы один язык'; return; }
    sset('wlx_langs', JSON.stringify(langs));
    var q = fuzzy.checked ? QUERY_ALL : QUERY_EMPTY;
    var wantJson = pluralsJson.checked;
    var kf = currentTask && currentTask.keys.length && onlyKeys.checked ? keyFilter(currentTask.keys) : null;
    exportTag = currentTask && currentTask.task ? currentTask.task : 'all';
    var total = comps.length * langs.length, done = 0, res = [], errs = [];
    function tick() { done++; barFill.style.width = Math.round(100 * done / total) + '%'; progText.textContent = 'Скачиваю… ' + done + ' из ' + total; }
    goBtn.disabled = true; resSec.classList.remove('hide'); results.textContent = '';
    barFill.style.width = '0%'; progText.textContent = 'Скачиваю… 0 из ' + total;

    pool(comps, 4, function (x) {
      return translations(x.p, x.c).then(function (trs) {
        return langs.reduce(function (chain, wanted) {
          return chain.then(function () {
            var code = matchLanguage(wanted, trs);
            if (!code) { errs.push([x.c, wanted, 'языка нет в компоненте']); tick(); return; }
            var src = trs.filter(function (t) { return t.is_source; })[0];
            var srcCode = src ? src.language.code : 'ru';
            return downloadPo(x.p, x.c, code, q).then(function (raw) {
              var r = filterPo(raw, false, kf);
              if (!r.plurals || !wantJson) return r;
              return Promise.all([units(x.p, x.c, code, q + ' AND has:plural'), componentFormat(x.p, x.c)]).then(function (a) {
                var j = pluralJson(a[0], a[1], srcCode, code, kf);
                if (!j.strings) return r;
                res.push({ component: x.c, language: code, strings: j.strings, words: j.words, text: j.text, ext: 'json' });
                return filterPo(raw, true, kf);
              }, function (e) {
                errs.push([x.c, code, 'плюралки не удалось выгрузить в .json, оставила их в .po: ' + friendly(e).split('\n')[0]]);
                return r;
              });
            }).then(function (r) {
              if (r.strings) res.push({ component: x.c, language: code, strings: r.strings, words: r.words, text: r.text, ext: 'po' });
            }).catch(function (e) { errs.push([x.c, code, friendly(e)]); }).then(tick);
          });
        }, Promise.resolve());
      }).catch(function (e) {
        errs.push([x.c, '*', friendly(e)]);
        langs.forEach(tick);
      });
    }).then(function () {
      goBtn.disabled = false;
      progText.textContent = 'Готово!';
      barFill.style.width = '100%';
      if (kf && kf.missing().length) errs.push(['—', '—', 'ключи не нашлись среди непереведённых (уже переведены или нет в компонентах): ' + kf.missing().join(', ')]);
      showResults(res, errs);
    });
  }

  function today() { return new Date().toISOString().slice(0, 10); }
  var ENGLISH_DIR = 'Английский ШТАТ';
  function isEnglish(code) { return baseLang(code) === 'en'; }
  var PLURAL_MARK = '_plural form';
  function poName(r) { return fileKey(r.component) + '_' + r.language + (r.ext === 'json' ? PLURAL_MARK + '.json' : '.po'); }
  function archivePath(r, layout, englishApart) {
    var folder = englishApart && isEnglish(r.language) ? ENGLISH_DIR
      : layout === 'language' ? langName(r.language)
      : layout === 'flat' ? ''
      : fileKey(r.component);
    return (folder ? folder + '/' : '') + poName(r);
  }
  function showResults(res, errs) {
    res.sort(function (a, b) { return (a.language + a.component).localeCompare(b.language + b.component); });
    results.textContent = '';
    if (!res.length) results.appendChild(el('p', { text: 'Непереведённых строк нет — всё переведено 🎉' }));
    else {
      var by = {};
      res.forEach(function (r) {
        var a = by[r.language] = by[r.language] || { files: 0, strings: 0, words: 0 };
        a.files++; a.strings += r.strings; a.words += r.words;
      });
      var t = el('table', {}, [el('tr', {}, [
        el('th', { text: 'Язык' }), el('th', { class: 'n', text: 'Файлов' }),
        el('th', { class: 'n', text: 'Строк' }), el('th', { class: 'n', text: 'Слов' }), el('th')
      ])]);
      Object.keys(by).sort(function (a, b) { return langName(a).localeCompare(langName(b), 'ru'); }).forEach(function (lang) {
        var a = by[lang];
        t.appendChild(el('tr', {}, [
          el('td', { title: lang }, [langLabel(lang)]), el('td', { class: 'n', text: String(a.files) }),
          el('td', { class: 'n', text: String(a.strings) }), el('td', { class: 'n', text: String(a.words) }),
          el('td', { class: 'n' }, [el('button', { class: 'b g s', text: 'Скачать .zip', onclick: function () {
            saveBlob(makeZip(res.filter(function (r) { return r.language === lang; })
              .map(function (r) { return { name: poName(r), text: r.text }; })), 'weblate_' + lang + '_' + today() + '.zip');
          } })])
        ]));
      });
      var layoutHint = el('span', { class: 'muted' });
      function updateHint() {
        var l = currentLayout();
        layoutHint.textContent = (l === 'language' ? 'папки по языкам' : l === 'flat' ? 'все файлы в одной папке' : 'папки по компонентам') +
          (englishApart.checked ? ', английский — в «' + ENGLISH_DIR + '»' : '') + ' + summary.csv (раскладку можно поменять выше)';
      }
      updateHint();
      layoutBox.addEventListener('change', updateHint);
      englishApart.addEventListener('change', updateHint);
      results.appendChild(el('div', { class: 'row' }, [
        el('button', { class: 'b', text: '⬇ Скачать всё одним архивом', onclick: function () {
          var layout = currentLayout(), eng = englishApart.checked;
          var files = res.map(function (r) { return { name: archivePath(r, layout, eng), text: r.text }; });
          files.sort(function (a, b) { return a.name.localeCompare(b.name, 'ru'); });
          var csv = '﻿компонент;язык;код;формат;строк;слов\n' + res.map(function (r) {
            return [r.component, langName(r.language), r.language, r.ext || 'po', r.strings, r.words].join(';');
          }).join('\n') + '\n';
          files.push({ name: 'summary.csv', text: csv });
          saveBlob(makeZip(files), 'weblate_' + (exportTag || 'all') + '_' + today() + '.zip');
        } }),
        layoutHint
      ]));
      results.appendChild(el('p', { class: 'muted', text: 'Или отдельный архив на язык:' }));
      results.appendChild(t);
      var dt = el('table', {}, [el('tr', {}, [el('th', { text: 'Компонент' }), el('th', { text: 'Язык' }),
        el('th', { class: 'n', text: 'Строк' }), el('th', { class: 'n', text: 'Слов' })])]);
      res.forEach(function (r) {
        dt.appendChild(el('tr', {}, [el('td', { text: r.component + (r.ext === 'json' ? ' · плюралки .json' : '') }), el('td', { title: r.language }, [langLabel(r.language)]),
          el('td', { class: 'n', text: String(r.strings) }), el('td', { class: 'n', text: String(r.words) })]));
      });
      results.appendChild(el('details', {}, [el('summary', { text: 'По компонентам' }), dt]));
    }
    if (errs.length) {
      var et = el('table');
      errs.forEach(function (e) { et.appendChild(el('tr', {}, e.map(function (v) { return el('td', { text: v }); }))); });
      results.appendChild(el('details', { open: '' }, [el('summary', { text: 'Проблемы: ' + errs.length, class: 'red' }), et]));
    }
    renderTracker(res);
  }

  /* ----- шаг «Записать в таблицу» после выгрузки ----- */
  function renderTracker(res) {
    if (!res.length) return;
    var box = el('div', { class: 'track' }, [el('h2', { text: '4. Записать задачу в таблицу' })]);
    results.appendChild(box);
    var c = trCfg();
    if (!c.url) {
      box.appendChild(el('p', { class: 'muted', text: 'Можно фиксировать, кому и что ушло на перевод, в общей Google Таблице — подключи её в ⚙ вверху окна.' }));
      return;
    }
    var t = currentTask || {};
    var by = {};
    res.forEach(function (r) {
      var a = by[r.language] = by[r.language] || { strings: 0, words: 0, comps: [] };
      a.strings += r.strings; a.words += r.words;
      if (a.comps.indexOf(r.component) < 0) a.comps.push(r.component);
    });
    var fTask = el('input', { type: 'text', value: t.task || '', placeholder: 'TRN-480' });
    var fUrl = el('input', { type: 'text', value: t.taskUrl || '', placeholder: 'ссылка на задачу' });
    var fTeam = el('input', { type: 'text', value: t.team || '' });
    var fDeadline = el('input', { type: 'text', value: t.deadline || '', placeholder: '01.10' });
    var fSmartcat = el('input', { type: 'text', placeholder: 'ссылка на проект в Smartcat' });
    var fComment = el('input', { type: 'text' });
    box.appendChild(el('div', { class: 'grid2' }, [
      el('label', {}, ['Задача', fTask]), el('label', {}, ['Ссылка на задачу', fUrl]),
      el('label', {}, ['Команда', fTeam]), el('label', {}, ['Срок', fDeadline]),
      el('label', {}, ['Smartcat', fSmartcat]), el('label', {}, ['Комментарий', fComment])
    ]));
    var tb = el('table', {}, [el('tr', {}, [el('th', { text: 'Язык' }), el('th', { class: 'n', text: 'Строк' }),
      el('th', { class: 'n', text: 'Слов' }), el('th', { text: 'Переводчик' })])]);
    var inputs = {}, lists = {};
    Object.keys(by).sort(function (a, b) { return langName(a).localeCompare(langName(b), 'ru'); }).forEach(function (code) {
      var dl = el('datalist', { id: 'wlx-tr-' + code.replace(/[^A-Za-z0-9_-]/g, '_') });
      var inp = el('input', { type: 'text', list: dl.id, value: sget('wlx_tr_last_' + code) || '', placeholder: 'кто переводит' });
      inputs[code] = inp; lists[code] = dl;
      tb.appendChild(el('tr', {}, [el('td', {}, [langLabel(code)]), el('td', { class: 'n', text: String(by[code].strings) }),
        el('td', { class: 'n', text: String(by[code].words) }), el('td', {}, [inp, dl])]));
    });
    box.appendChild(tb);
    loadTranslators().then(function (list) {
      Object.keys(inputs).forEach(function (code) {
        var names = list.filter(function (x) {
          var l = x.lang.toLowerCase();
          return l === code.toLowerCase() || l === baseLang(code) || l === langName(code).toLowerCase();
        }).map(function (x) { return x.name; });
        var dl = lists[code];
        if (dl) names.forEach(function (n) { dl.appendChild(el('option', { value: n })); });
        if (!inputs[code].value && names.length === 1) inputs[code].value = names[0];
      });
    });
    var msg = el('span', { class: 'muted' });
    var btn = el('button', { class: 'b', text: 'Записать в таблицу', onclick: function () {
      var who = trCfg().who;
      var rows = Object.keys(inputs).map(function (code) {
        if (inputs[code].value) sset('wlx_tr_last_' + code, inputs[code].value);
        return {
          task: fTask.value.trim(), taskUrl: fUrl.value.trim(), team: fTeam.value.trim(), components: by[code].comps,
          lang: code, langName: langName(code), strings: by[code].strings, words: by[code].words,
          translator: inputs[code].value.trim(), deadline: fDeadline.value.trim(), smartcat: fSmartcat.value.trim(),
          comment: fComment.value.trim(), who: who
        };
      });
      btn.disabled = true; msg.textContent = 'Записываю…';
      trPost({ action: 'export', rows: rows }).then(function (j) {
        msg.className = 'ok';
        msg.textContent = '✓ В таблице: новых строк ' + j.added + (j.updated ? ', обновлено ' + j.updated : '');
      }, function (e) { msg.className = 'red'; msg.textContent = '✗ ' + (e.message || e); btn.disabled = false; });
    } });
    box.appendChild(el('div', { class: 'row' }, [btn, msg]));
    if (!c.who) box.appendChild(el('p', { class: 'muted', text: 'Совет: впиши своё имя в ⚙ — оно попадёт в колонку «Выгрузил(а)».' }));
  }

  /* ----- import logic ----- */
  var uploads = [];
  ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('over'); }); });
  ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('over'); }); });
  drop.addEventListener('drop', function (e) { addFiles(e.dataTransfer.files); });
  fileInput.addEventListener('change', function () { addFiles(fileInput.files); fileInput.value = ''; });

  function savedComps() { try { return JSON.parse(sget('wlx_comps') || '[]'); } catch (e) { return []; } }
  function defaultProject() {
    var sc = savedComps(), l = parseLinks(location.pathname);
    return sc.length ? sc[0].p : l.length ? l[0].p : 'global_site';
  }
  function withTranslations(p, c) {
    return projectComponents(p).catch(function () {}).then(function () { return translations(p, c); })
      .then(function (trs) { return { p: p, c: c, trs: trs }; }, function () { return null; });
  }
  function byRuName(folder, trs) {
    var f = (folder || '').trim().toLowerCase();
    if (!f) return null;
    var hit = trs.filter(function (t) { return langName(t.language.code).toLowerCase() === f; });
    return hit.length === 1 ? hit[0].language.code : null;
  }
  /* имя файла без языка → компонент: сначала среди компонентов прошлой выгрузки */
  function resolveComponent(key) {
    var sc = savedComps(), last = function (c) { return c.split('/').pop(); };
    var cands = sc.filter(function (x) { return fileKey(x.c) === key || x.c === key; });
    if (!cands.length) cands = sc.filter(function (x) { return last(x.c) === key; });
    if (!cands.length) cands = sc.filter(function (x) { return last(x.c).slice(-(key.length + 1)) === '-' + key; });
    if (cands.length > 1) return Promise.resolve(null);
    var pick = cands[0] || { p: defaultProject(), c: key.split('__').join('/') };
    return withTranslations(pick.p, pick.c);
  }
  /* из .json с плюралками убираем то, что осталось на русском (не переведено) */
  function stripJson(u) {
    var keys = Object.keys(u.obj);
    if (keys.some(function (k) { return typeof u.obj[k] !== 'string'; })) return Promise.resolve(u);
    return units(u.p, u.c, u.lang, 'has:plural').then(function (list) {
      var src = {};
      list.forEach(function (x) { (x.source || []).forEach(function (s) { src[s] = 1; }); });
      var kept = {}, dropped = 0;
      keys.forEach(function (k) { var v = u.obj[k]; if (!v || src[v]) dropped++; else kept[k] = v; });
      u.filled = Object.keys(kept).length;
      u.text = JSON.stringify(kept, null, 2) + '\n';
      if (!u.filled) u.skip = 'всё ещё на русском — похоже, не переведено, пропущу';
      else if (dropped) u.note = dropped + ' ещё на русском — их не отправлю';
      return u;
    }, function () { u.note = 'не смогла сверить с исходником'; return u; });
  }
  function detect(f) {
    var isJson = /\.json$/i.test(f.name), h = {};
    var u = { name: f.name, text: f.text };
    if (isJson) {
      try { u.obj = JSON.parse(f.text); } catch (e) { u.error = 'файл .json не читается'; return Promise.resolve(u); }
      var vals = Object.keys(u.obj).map(function (k) { return u.obj[k]; });
      u.total = vals.length;
      u.filled = vals.filter(function (v) { return v !== ''; }).length;
    } else {
      var inf = poInfo(f.text);
      h = inf.headers; u.filled = inf.filled; u.total = inf.total;
      if (!inf.filled) u.skip = 'в файле нет переведённых строк — пропущу';
      var lt = /\/projects\/([^\s>"]+)/.exec(h['Language-Team'] || '');
      var segs = lt ? lt[1].split('/').filter(Boolean) : [];
      if (segs.length >= 3) {
        u.p = segs[0]; u.c = segs.slice(1, -1).join('/'); u.lang = segs[segs.length - 1];
        return withTranslations(u.p, u.c).then(function (r) {
          if (!r) u.error = 'компонент «' + u.c + '» не найден';
          return u;
        });
      }
    }
    var parts = f.name.split('/'), base = parts.pop().replace(/\.(po|json)$/i, '').replace(/[ _.-]*plurals?([ _-]*forms?)?$/i, '');
    var suffix = /^(.+)[._]([a-z]{2,3}(?:[_@-][A-Za-z0-9]+)?)$/.exec(base);
    u.c = suffix ? suffix[1] : base;
    var folder = parts.pop() || '';
    if (folder === ENGLISH_DIR) folder = 'en';
    var wanted = h['Language'] || (suffix && suffix[2]) || folder;
    if (!wanted) { u.error = 'не понятно, какой это язык'; return Promise.resolve(u); }
    return resolveComponent(u.c).then(function (r) {
      if (!r) { u.error = 'компонент «' + u.c + '» не найден — переименуй файл в <компонент>_<язык>'; return u; }
      u.p = r.p; u.c = r.c;
      u.lang = matchLanguage(wanted.replace('-', '_'), r.trs) || byRuName(folder, r.trs);
      if (!u.lang) { u.error = 'язык «' + wanted + '» не найден в компоненте'; return u; }
      return isJson ? stripJson(u) : u;
    });
  }
  function addFiles(list) {
    errU.textContent = '';
    var files = Array.prototype.slice.call(list || []);
    Promise.all(files.map(function (file) {
      if (/\.zip$/i.test(file.name)) return file.arrayBuffer().then(readZip);
      if (/\.(po|json)$/i.test(file.name)) return file.text().then(function (t) { return [{ name: file.name, text: t }]; });
      return Promise.resolve([]);
    })).then(function (groups) {
      var all = [].concat.apply([], groups);
      if (!all.length) throw new Error('Не нашла .po файлов');
      return Promise.all(all.map(detect));
    }).then(function (found) {
      found.forEach(function (u) {
        var kind = function (x) { return /\.json$/i.test(x.name) ? 'json' : 'po'; };
        if (!u.error) uploads = uploads.filter(function (x) { return !(x.p === u.p && x.c === u.c && x.lang === u.lang && kind(x) === kind(u)); });
        uploads.push(u);
      });
      renderPreview();
    }).catch(function (e) { errU.textContent = friendly(e); });
  }
  function renderPreview() {
    preview.textContent = ''; upResults.textContent = '';
    if (!uploads.length) { upSec.classList.add('hide'); return; }
    var t = el('table', {}, [el('tr', {}, [el('th', { text: 'Файл' }), el('th', { text: 'Куда' }),
      el('th', { class: 'n', text: 'С переводом' }), el('th', { text: 'Статус' })])]);
    uploads.forEach(function (u) {
      u.row = el('td', { class: u.error ? 'red' : (u.sent ? 'ok' : 'muted'), text: u.error || u.status || u.skip || (u.note ? 'готов · ' + u.note : 'готов') });
      t.appendChild(el('tr', {}, [
        el('td', { text: u.name }),
        u.lang ? el('td', { title: u.p + '/' + u.c + '/' + u.lang }, [el('div', { text: u.c }), langLabel(u.lang)]) : el('td', { text: '—' }),
        el('td', { class: 'n', text: u.filled + ' из ' + u.total }),
        u.row
      ]));
    });
    preview.appendChild(t);
    preview.appendChild(el('div', { class: 'row' }, [
      el('span', { class: 'muted', text: 'Файлов: ' + uploads.length }),
      el('button', { class: 'b g s', text: 'Очистить список', onclick: function () { uploads = []; renderPreview(); } })
    ]));
    upSec.classList.remove('hide');
  }
  function setRow(u, cls, text) { u.status = text; u.row.className = cls; u.row.textContent = text; }
  function runUpload() {
    var todo = uploads.filter(function (u) { return !u.error && !u.skip && !u.sent; });
    if (!todo.length) { upResults.textContent = 'Нечего загружать'; return; }
    var opts = { method: optMethod.value, fuzzy: optFuzzy.value, conflicts: optConf.value };
    sset('wlx_m', opts.method); sset('wlx_f', opts.fuzzy); sset('wlx_c', opts.conflicts);
    upBtn.disabled = true; upResults.textContent = 'Загружаю…';
    var ok = 0, bad = 0;
    csrfToken().then(function (token) {
      return pool(todo, 3, function (u) {
        setRow(u, 'muted', 'загружаю…');
        return uploadPo(u, opts, token).then(function (r) {
          u.sent = true; ok++;
          setRow(u, 'ok', r.viaForm ? '✓ отправлено (проверь в Weblate)'
            : '✓ принято ' + (r.accepted != null ? r.accepted : '?') + ' из ' + (r.total != null ? r.total : '?') +
              (r.skipped ? ', пропущено ' + r.skipped : '') + (r.not_found ? ', не найдено ' + r.not_found : ''));
        }).catch(function (e) {
          bad++;
          setRow(u, 'red', friendly(e).split('\n')[0]);
          u.row.title = String(e.message || e);
        });
      });
    }).then(function () {
      upResults.textContent = 'Готово: загружено ' + ok + (bad ? ', с ошибкой ' + bad + ' (наведи на ошибку, чтобы увидеть подробности)' : '');
      var sent = todo.filter(function (u) { return u.sent; });
      if (!sent.length || !trCfg().url) return;
      var note = el('div', { class: 'muted', text: 'Отмечаю в таблице задач…' });
      upResults.appendChild(note);
      trPost({ action: 'upload', who: trCfg().who, items: sent.map(function (u) { return { component: u.c, lang: u.lang }; }) }).then(function (j) {
        note.className = 'ok';
        note.textContent = j.marked ? '✓ В таблице отмечено строк: ' + j.marked + ' (' + Object.keys(j.rows).map(function (k) { return k + ' — ' + j.rows[k]; }).join('; ') + ')'
          : 'В таблице нет открытых задач на эти компоненты и языки';
      }, function (e) { note.className = 'red'; note.textContent = 'Таблица задач: ' + (e.message || e); });
    }).catch(function (e) {
      upResults.textContent = friendly(e);
    }).then(function () { upBtn.disabled = false; });
  }

  document.body.appendChild(host);
  window.__wlExport = { show: show };
})();
