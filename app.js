const ELEMENTS = ["wood", "fire", "earth", "metal", "water"];
const ELEMENT_NAME = {
  wood: "木",
  fire: "火",
  earth: "土",
  metal: "金",
  water: "水"
};

const ELEMENT_ICON = {
  wood: "🌿",
  fire: "🔥",
  earth: "🪨",
  metal: "⚔",
  water: "💧"
};

const LANE_COUNT = 3;
const LANE_TILE_COUNT = 12;
const LANE_LEFT = 8;
const LANE_RIGHT = 92;
const SUMMON_BRAWL_RANGE = 7.6;
const LANE_THEME = [
  { name: "青龙道", mark: "青" },
  { name: "白虎道", mark: "白" },
  { name: "朱雀道", mark: "朱" }
];

const EVENT_ROTATION = [
  {
    id: "gale",
    name: "烈风战域",
    desc: "全体行动体飞行时间-0.25秒。"
  },
  {
    id: "aegis",
    name: "护盾潮汐",
    desc: "直击角色伤害额外-30%，拦截收益提高。"
  },
  {
    id: "surge",
    name: "灵涌时刻",
    desc: "五行资源回复+35%，控制效果强化。"
  }
];

const AI_DIFFICULTY = {
  easy: {
    label: "简单",
    thinkInterval: 1.08,
    scoreMul: 0.88,
    defenseBiasAdd: -0.08,
    urgencyIntercept: 1.45,
    castGapMul: 1.14,
    zeroCostGap: 0.86,
    discardRefund: 0.42
  },
  normal: {
    label: "普通",
    thinkInterval: 0.78,
    scoreMul: 1,
    defenseBiasAdd: 0,
    urgencyIntercept: 1.7,
    castGapMul: 1,
    zeroCostGap: 0.72,
    discardRefund: 0.5
  },
  hard: {
    label: "困难",
    thinkInterval: 0.62,
    scoreMul: 1.14,
    defenseBiasAdd: 0.08,
    urgencyIntercept: 1.95,
    castGapMul: 0.9,
    zeroCostGap: 0.58,
    discardRefund: 0.56
  },
  nightmare: {
    label: "噩梦",
    thinkInterval: 0.5,
    scoreMul: 1.28,
    defenseBiasAdd: 0.12,
    urgencyIntercept: 2.2,
    castGapMul: 0.84,
    zeroCostGap: 0.5,
    discardRefund: 0.62
  }
};

function createLaneState() {
  return Array.from({ length: LANE_COUNT }, () => ({
    meTrack: [],
    enemyTrack: [],
    meNextBonus: null,
    enemyNextBonus: null,
    meAura: { element: "", expiresAt: 0, damageMul: 1 },
    enemyAura: { element: "", expiresAt: 0, damageMul: 1 }
  }));
}

function getAiProfile() {
  return AI_DIFFICULTY[state.aiDifficulty] || AI_DIFFICULTY.normal;
}

const ROLE_LIST = [
  { id: "blaze", name: "炎策师", main: "fire", passive: "火系直击穿透部分掩护，爆发更稳定" },
  { id: "tide", name: "潮律者", main: "water", passive: "水系卡资源消耗-1（最低1），功能牌保底更强" },
  { id: "iron", name: "铸锋客", main: "metal", passive: "反制成功额外造成3点伤害并提升拦截收益" }
];

const CARD_POOL = [
  {
    id: "c1",
    name: "烈焰突袭",
    type: "attack",
    element: "fire",
    baseDelay: 2.4,
    power: 10,
    desc: "单体直伤，适合终结。",
    cost: { fire: 2 }
  },
  {
    id: "c2",
    name: "藤蔓缠绕",
    type: "control",
    element: "wood",
    baseDelay: 2.8,
    power: 0,
    effect: "slow",
    desc: "控制牌：将目标行动体结算时间延后。",
    cost: { wood: 2 }
  },
  {
    id: "c3",
    name: "玄水屏障",
    type: "defense",
    element: "water",
    baseDelay: 1.6,
    power: 0,
    effect: "block",
    desc: "防御牌：削弱敌方最近攻击行动体伤害。",
    cost: { water: 2 }
  },
  {
    id: "c4",
    name: "地脉回响",
    type: "attack",
    element: "earth",
    baseDelay: 3.2,
    power: 14,
    desc: "高伤重击，飞行较慢。",
    cost: { earth: 2, fire: 1 }
  },
  {
    id: "c5",
    name: "金锋反弹",
    type: "control",
    element: "metal",
    baseDelay: 2.2,
    power: 6,
    effect: "counter",
    desc: "控制牌：将敌方攻击反弹回去。",
    cost: { metal: 2 }
  },
  {
    id: "c6",
    name: "寒潮压制",
    type: "attack",
    element: "water",
    baseDelay: 2.6,
    power: 8,
    desc: "稳定输出，兼具元素连锁价值。",
    cost: { water: 2, metal: 1 }
  },
  {
    id: "c8",
    name: "冰霜陷阱",
    type: "utility",
    element: "water",
    baseDelay: 0.2,
    power: 0,
    effect: "trap_freeze",
    desc: "陷阱：触发后冻结并减速该行行动体。",
    cost: { water: 2 }
  },
  {
    id: "c9",
    name: "缚灵陷阱",
    type: "utility",
    element: "wood",
    baseDelay: 0.2,
    power: 0,
    effect: "trap_snare",
    desc: "陷阱：捕获中低威力行动体，或重度减速。",
    cost: { wood: 2, earth: 1 }
  },
  {
    id: "c10",
    name: "灵木采气",
    type: "utility",
    element: "wood",
    baseDelay: 0.2,
    power: 0,
    effect: "resource_card",
    effectValue: 3.2,
    desc: "资源牌：立即获得木系资源。",
    cost: {}
  },
  {
    id: "c11",
    name: "赤焰采气",
    type: "utility",
    element: "fire",
    baseDelay: 0.2,
    power: 0,
    effect: "resource_card",
    effectValue: 3.2,
    desc: "资源牌：立即获得火系资源。",
    cost: {}
  },
  {
    id: "c12",
    name: "夺灵飞刃",
    type: "attack",
    element: "metal",
    baseDelay: 2.3,
    power: 5,
    effect: "steal_resource",
    effectValue: 1.4,
    desc: "命中敌方后掠夺资源并转移给自己，可被拦截。",
    cost: { metal: 2 }
  },
  {
    id: "c13",
    name: "聚元符",
    type: "attack",
    element: "earth",
    baseDelay: 2.5,
    power: 4,
    effect: "gain_resource",
    effectValue: 1.6,
    desc: "命中敌方后直接获得资源，可被拦截。",
    cost: { earth: 2 }
  },
  {
    id: "c14",
    name: "机运流矢",
    type: "attack",
    element: "water",
    baseDelay: 2.4,
    power: 4,
    effect: "draw_on_hit",
    effectValue: 1,
    desc: "命中敌方后额外抽1张牌，可被拦截。",
    cost: { water: 2 }
  },
  {
    id: "c17",
    name: "厚土采气",
    type: "utility",
    element: "earth",
    baseDelay: 0.2,
    power: 0,
    effect: "resource_card",
    effectValue: 3.2,
    desc: "资源牌：立即获得土系资源。",
    cost: {}
  },
  {
    id: "c18",
    name: "玄金采气",
    type: "utility",
    element: "metal",
    baseDelay: 0.2,
    power: 0,
    effect: "resource_card",
    effectValue: 3.2,
    desc: "资源牌：立即获得金系资源。",
    cost: {}
  },
  {
    id: "c19",
    name: "寒潮采气",
    type: "utility",
    element: "water",
    baseDelay: 0.2,
    power: 0,
    effect: "resource_card",
    effectValue: 3.2,
    desc: "资源牌：立即获得水系资源。",
    cost: {}
  },
  {
    id: "c23",
    name: "木灵幼卫",
    type: "utility",
    element: "wood",
    baseDelay: 0.2,
    power: 0,
    effect: "summon_scout",
    desc: "召唤单位：缓慢推进，遇到建筑会停下攻击；可被攻击。",
    cost: { wood: 2 }
  },
  {
    id: "c24",
    name: "岩甲傀儡",
    type: "utility",
    element: "earth",
    baseDelay: 0.2,
    power: 0,
    effect: "summon_guard",
    desc: "重型召唤：移速更慢但更耐打，擅长拆建筑；可被攻击。",
    cost: { earth: 2, metal: 1 }
  },
  {
    id: "c25",
    name: "焰尾疾灵",
    type: "utility",
    element: "fire",
    baseDelay: 0.2,
    power: 0,
    effect: "summon_rusher",
    desc: "冲锋召唤：高速推进，适合快速压血线；可被攻击。",
    cost: { fire: 2 }
  },
  {
    id: "c26",
    name: "潮汐术灵",
    type: "utility",
    element: "water",
    baseDelay: 0.2,
    power: 0,
    effect: "summon_tide",
    desc: "均衡召唤：推进稳定，拆塔与压制能力均衡；可被攻击。",
    cost: { water: 2, wood: 1 }
  },
  {
    id: "c27",
    name: "玄铁卫士",
    type: "utility",
    element: "metal",
    baseDelay: 0.2,
    power: 0,
    effect: "summon_taunt",
    desc: "前排召唤：高血量低速推进，擅长吸收火力；可被攻击。",
    cost: { metal: 2, earth: 1 }
  },
  {
    id: "c28",
    name: "藤甲兽",
    type: "utility",
    element: "wood",
    baseDelay: 0.2,
    power: 0,
    effect: "summon_vine",
    desc: "韧性召唤：中速推进，持续站场能力较强；可被攻击。",
    cost: { wood: 2, fire: 1 }
  },
  {
    id: "c29",
    name: "地铸巨像",
    type: "utility",
    element: "earth",
    baseDelay: 0.2,
    power: 0,
    effect: "summon_jugger",
    desc: "超重召唤：极高耐久与拆塔能力，推进缓慢；可被攻击。",
    cost: { earth: 3, metal: 1 }
  },
  {
    id: "c30",
    name: "引燃藤鞭",
    type: "attack",
    element: "wood",
    baseDelay: 2.3,
    power: 6,
    comboStarter: "kindling",
    comboLabel: "薪引",
    desc: "连携起手：点燃引信，6秒内火系终结牌获得强化。",
    cost: { wood: 2 }
  },
  {
    id: "c31",
    name: "焚林爆火",
    type: "attack",
    element: "fire",
    baseDelay: 2.6,
    power: 9,
    comboConsumer: "kindling",
    comboLabel: "薪引",
    comboPowerBonus: 7,
    desc: "连携终结：若触发薪引，额外+7伤害。",
    cost: { fire: 2, wood: 1 }
  },
  {
    id: "c32",
    name: "玄铁标定",
    type: "attack",
    element: "metal",
    baseDelay: 2.1,
    power: 5,
    comboStarter: "mark",
    comboLabel: "标定",
    desc: "连携起手：标记目标，6秒内掠夺牌效果提升。",
    cost: { metal: 2 }
  },
  {
    id: "c33",
    name: "裂潮掠夺",
    type: "attack",
    element: "water",
    baseDelay: 2.5,
    power: 5,
    effect: "steal_resource",
    effectValue: 1.2,
    comboConsumer: "mark",
    comboLabel: "标定",
    comboEffectValueBonus: 1.0,
    desc: "连携终结：若触发标定，额外掠夺+1.0资源。",
    cost: { water: 2, metal: 1 }
  },
  {
    id: "c34",
    name: "土印结阵",
    type: "utility",
    element: "earth",
    baseDelay: 0.2,
    power: 0,
    comboStarter: "seed",
    comboLabel: "结阵",
    effect: "summon_scout",
    desc: "连携起手：布置阵印，6秒内召唤终结牌获得强化。",
    cost: { earth: 2 }
  },
  {
    id: "c35",
    name: "木灵群起",
    type: "utility",
    element: "wood",
    baseDelay: 0.2,
    power: 0,
    effect: "summon_vine",
    comboConsumer: "seed",
    comboLabel: "结阵",
    comboSummonHpBonus: 8,
    comboSummonAtkBonus: 2,
    desc: "连携终结：若触发结阵，召唤体生命与攻击提升。",
    cost: { wood: 2, earth: 1 }
  },
  {
    id: "c36",
    name: "烈焰道标",
    type: "utility",
    element: "fire",
    baseDelay: 0.2,
    power: 0,
    effect: "lane_attune_fire",
    desc: "通道属性：将该线调谐为火脉，10秒内我方火系伤害提升。",
    cost: { fire: 2 }
  },
  {
    id: "c37",
    name: "玄水道标",
    type: "utility",
    element: "water",
    baseDelay: 0.2,
    power: 0,
    effect: "lane_attune_water",
    desc: "通道属性：将该线调谐为水脉，10秒内我方水系伤害提升。",
    cost: { water: 2 }
  },
  {
    id: "c38",
    name: "逆流改道",
    type: "utility",
    element: "metal",
    baseDelay: 0.2,
    power: 0,
    effect: "lane_scramble",
    desc: "通道属性：打乱该线敌方元素累计并清除敌方通道调谐。",
    cost: { metal: 2, water: 1 }
  },
  {
    id: "c39",
    name: "双流镜像",
    type: "utility",
    element: "metal",
    baseDelay: 0.2,
    power: 0,
    effect: "spell_spread_2",
    desc: "辅助：下一个伤害法术将同步释放到2条通道。",
    cost: { metal: 2 }
  },
  {
    id: "c40",
    name: "三才分光",
    type: "utility",
    element: "fire",
    baseDelay: 0.2,
    power: 0,
    effect: "spell_spread_3",
    desc: "辅助：下一个伤害法术将同步释放到3条通道。",
    cost: { fire: 2, metal: 1 }
  },
  {
    id: "c41",
    name: "爆焰囊虫",
    type: "utility",
    element: "fire",
    baseDelay: 0.2,
    power: 0,
    effect: "summon_bomber",
    desc: "爆破召唤：到达终点后自爆造成高额伤害。",
    cost: { fire: 2, earth: 1 }
  },
  {
    id: "c42",
    name: "噬财夜鸦",
    type: "utility",
    element: "metal",
    baseDelay: 0.2,
    power: 0,
    effect: "summon_raider",
    desc: "掠夺召唤：到达终点后持续偷取大量资源。",
    cost: { metal: 2, water: 1 }
  },
  {
    id: "c43",
    name: "血藤妖",
    type: "utility",
    element: "wood",
    baseDelay: 0.2,
    power: 0,
    effect: "summon_blood",
    desc: "吸血召唤：到达终点后持续吸取对方生命并回复我方。",
    cost: { wood: 2, fire: 1 }
  },
  {
    id: "c44",
    name: "塔体加固",
    type: "utility",
    element: "earth",
    baseDelay: 0.2,
    power: 0,
    effect: "tower_fortify",
    desc: "强化箭塔：恢复耐久并提升最大耐久。",
    cost: { earth: 2 }
  },
  {
    id: "c45",
    name: "穿甲箭簇",
    type: "utility",
    element: "metal",
    baseDelay: 0.2,
    power: 0,
    effect: "tower_focus",
    desc: "强化箭塔：提高攻击力与射程。",
    cost: { metal: 2, fire: 1 }
  },
  {
    id: "c46",
    name: "疾风机括",
    type: "utility",
    element: "wood",
    baseDelay: 0.2,
    power: 0,
    effect: "tower_volley",
    desc: "强化箭塔：提升攻速并小幅提升射程。",
    cost: { wood: 2, water: 1 }
  },
  {
    id: "c47",
    name: "试探飞矢",
    type: "attack",
    element: "metal",
    baseDelay: 2.4,
    power: 3,
    desc: "零费轻攻：用于过渡与补伤，避免卡手。",
    cost: {}
  },
  {
    id: "c48",
    name: "巡线牵制",
    type: "control",
    element: "wood",
    baseDelay: 2.5,
    power: 0,
    effect: "slow",
    desc: "零费控制：延后敌方最近行动体结算时间。",
    cost: {}
  },
  {
    id: "c49",
    name: "临战调谐",
    type: "utility",
    element: "water",
    baseDelay: 0.2,
    power: 0,
    effect: "lane_attune_water",
    desc: "零费功能：快速给通道挂水脉调谐。",
    cost: {}
  },
  {
    id: "c50",
    name: "前线侦召",
    type: "utility",
    element: "earth",
    baseDelay: 0.2,
    power: 0,
    effect: "summon_scout",
    desc: "零费召唤：投入低强度前线单位，缓解手牌节奏。",
    cost: {}
  }
];

const DEFAULT_DECK_IDS = ["c1", "c2", "c3", "c4", "c5", "c6", "c8", "c9", "c10", "c11", "c17", "c18", "c19", "c12", "c13", "c14", "c23", "c24", "c25", "c26", "c27", "c28", "c29", "c30", "c31", "c32", "c33", "c34", "c35", "c36", "c37", "c38", "c39", "c40", "c41", "c42", "c47", "c48", "c49", "c50"];
const DECK_CACHE_KEY = "wuxing_battle_demo_deck_v1";

const state = {
  role: null,
  myHp: 100,
  enemyHp: 100,
  queue: [],
  env: {
    main: { type: "fire", power: 3 },
    sub: { type: "wood", power: 2 }
  },
  gameTime: 0,
  running: false,
  simSpeed: 1,
  aiDifficulty: "normal",
  cartoonTheme: "soft",
  reducedFx: false,
  lastStamp: 0,
  rafId: null,
  drawTimer: 0,
  enemyThinkTimer: 0,
  envDecayTimer: 0,
  eventTimer: 0,
  eventIndex: 0,
  battlefieldEvent: EVENT_ROTATION[0],
  hazardTimer: 0,
  pendingCast: false,
  dragCardIndex: null,
  pointerDragging: false,
  dragStartX: 0,
  dragStartY: 0,
  dragStarted: false,
  suppressCardClick: false,
  armedCardIndex: null,
  hoverCardIndex: null,
  laneReco: {
    lanes: [],
    scoreByLane: [0, 0, 0],
    reasonByLane: ["", "", ""],
    text: ""
  },
  dragPreview: {
    active: false,
    fromX: 0,
    fromY: 0,
    toX: 0,
    toY: 0,
    target: "",
    magnetTargetId: null
  },
  enemyProjectileTrack: [],
  field: {
    walls: [],
    generators: [],
    summons: [],
    traps: [],
    arrowTowers: [],
    arrowShots: [],
    hazards: [],
    lanes: createLaneState()
  },
  castFxUntil: 0,
  myCastLockUntil: 0,
  enemyCastLockUntil: 0,
  myDiscardLockUntil: 0,
  hitFx: { my: 0, enemy: 0 },
  floatTexts: [],
  decisionFeed: [],
  aiRead: {
    recent: [],
    window: 16
  },
  sharedRecentElements: [],
  logLines: [],
  maxLogLines: 180,
  deckBuilder: {
    minSize: 24,
    maxSize: 40,
    maxPerCard: 3,
    counts: {}
  },
  my: {
    deck: [],
    hand: [],
    discard: [],
    maxHand: 7,
    drawCooldown: 3.4,
    resources: createResourceState(),
    combo: { key: "", expiresAt: 0 },
    nextAttackSpread: 1
  },
  enemy: {
    deck: [],
    hand: [],
    discard: [],
    maxHand: 7,
    resources: createResourceState(),
    combo: { key: "", expiresAt: 0 },
    nextAttackSpread: 1
  }
};

const el = {
  prepScreen: document.getElementById("prepScreen"),
  battleScreen: document.getElementById("battleScreen"),
  roleList: document.getElementById("roleList"),
  hand: document.getElementById("hand"),
  timeline: document.getElementById("timeline"),
  resourceBoard: document.getElementById("resourceBoard"),
  mainEnv: document.getElementById("mainEnv"),
  subEnv: document.getElementById("subEnv"),
  myHp: document.getElementById("myHp"),
  enemyHp: document.getElementById("enemyHp"),
  myHpBar: document.getElementById("myHpBar"),
  enemyHpBar: document.getElementById("enemyHpBar"),
  battleAlert: document.getElementById("battleAlert"),
  myRoleName: document.getElementById("myRoleName"),
  enemyRoleName: document.getElementById("enemyRoleName"),
  tick: document.getElementById("tick"),
  deckInfo: document.getElementById("deckInfo"),
  handCount: document.getElementById("handCount"),
  castCd: document.getElementById("castCd"),
  eventName: document.getElementById("eventName"),
  decisionFeed: document.getElementById("decisionFeed"),
  handIntel: document.getElementById("handIntel"),
  recentElements: document.getElementById("recentElements"),
  deckBuilderList: document.getElementById("deckBuilderList"),
  deckCount: document.getElementById("deckCount"),
  btnDeckDefault: document.getElementById("btnDeckDefault"),
  prepNotice: document.getElementById("prepNotice"),
  log: document.getElementById("log"),
  introOverlay: document.getElementById("introOverlay"),
  resultModal: document.getElementById("resultModal"),
  resultTitle: document.getElementById("resultTitle"),
  resultDesc: document.getElementById("resultDesc"),
  resultMyHp: document.getElementById("resultMyHp"),
  resultEnemyHp: document.getElementById("resultEnemyHp"),
  resultTime: document.getElementById("resultTime"),
  btnRematch: document.getElementById("btnRematch"),
  btnCloseResult: document.getElementById("btnCloseResult"),
  btnStart: document.getElementById("btnStart"),
  btnModeLocal: document.getElementById("btnModeLocal"),
  btnModeOnline: document.getElementById("btnModeOnline"),
  btnCreateRoom: document.getElementById("btnCreateRoom"),
  btnJoinRoom: document.getElementById("btnJoinRoom"),
  btnCopyInvite: document.getElementById("btnCopyInvite"),
  btnLobbyReady: document.getElementById("btnLobbyReady"),
  joinRoomCode: document.getElementById("joinRoomCode"),
  inviteLink: document.getElementById("inviteLink"),
  netStatus: document.getElementById("netStatus"),
  roomCodeText: document.getElementById("roomCodeText"),
  lobbyRole: document.getElementById("lobbyRole"),
  lobbyLink: document.getElementById("lobbyLink"),
  lobbyMeState: document.getElementById("lobbyMeState"),
  lobbyPeerState: document.getElementById("lobbyPeerState"),
  lobbyLog: document.getElementById("lobbyLog"),
  netOnlineBox: document.getElementById("netOnlineBox"),
  btnBackPrep: document.getElementById("btnBackPrep"),
  btnNext: document.getElementById("btnNext"),
  aiDifficulty: document.getElementById("aiDifficulty"),
  battleSpeed: document.getElementById("battleSpeed"),
  btnFxLite: document.getElementById("btnFxLite"),
  btnThemeCartoon: document.getElementById("btnThemeCartoon"),
  btnDecisionPanel: document.getElementById("btnDecisionPanel"),
  btnLogPanel: document.getElementById("btnLogPanel"),
  dragLine: null,
  dragDot: null
};

let introTimer = null;
const net = {
  mode: "local",
  role: "",
  connected: false,
  wsConnected: false,
  roomCode: "",
  playerId: "",
  peerCount: 1,
  peerOnline: false,
  myReady: false,
  peerReady: false,
  myRematch: false,
  peerRematch: false,
  ws: null,
  wsRetryTimer: null,
  wsRetryCount: 0,
  pollSince: 0,
  pollTimer: null,
  snapshotAcc: 0
};
const lobbyEvents = [];

function isOnlineMode() {
  return net.mode === "online" && net.connected;
}

function setNetStatus(text) {
  if (el.netStatus) el.netStatus.textContent = `状态：${text}`;
}

function getInviteLink(code = net.roomCode) {
  if (!code) return "";
  try {
    const u = new URL(window.location.href);
    u.searchParams.set("room", code);
    return u.toString();
  } catch (_) {
    return `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(code)}`;
  }
}

function syncInviteLink() {
  if (!el.inviteLink) return;
  const link = getInviteLink();
  el.inviteLink.value = link || "";
}

function pushLobbyEvent(text) {
  const stamp = new Date().toLocaleTimeString("zh-CN", { hour12: false });
  lobbyEvents.unshift(`[${stamp}] ${text}`);
  if (lobbyEvents.length > 14) lobbyEvents.length = 14;
  if (el.lobbyLog) el.lobbyLog.textContent = lobbyEvents.join("\n");
}

function updateLobbyBoard() {
  if (el.lobbyRole) el.lobbyRole.textContent = !net.connected ? "-" : (net.role === "host" ? "房主" : "客机");
  if (el.lobbyLink) el.lobbyLink.textContent = !net.connected ? "-" : (net.wsConnected ? "WebSocket" : "轮询");
  if (el.lobbyMeState) {
    if (!net.connected) el.lobbyMeState.textContent = "未连接";
    else el.lobbyMeState.textContent = net.myReady ? "已准备" : "未准备";
  }
  if (el.lobbyPeerState) {
    if (!net.connected) el.lobbyPeerState.textContent = "未加入";
    else if (!(net.peerOnline || net.peerCount >= 2)) el.lobbyPeerState.textContent = "未加入";
    else el.lobbyPeerState.textContent = net.peerReady ? "已准备" : "未准备";
  }
  if (el.btnLobbyReady) {
    const canUse = net.mode === "online" && net.connected;
    el.btnLobbyReady.disabled = !canUse;
    el.btnLobbyReady.textContent = net.myReady ? "取消准备" : "准备";
  }
}

function setPrepNotice(text = "", warn = false) {
  if (!el.prepNotice) return;
  el.prepNotice.textContent = text;
  el.prepNotice.classList.toggle("warn", !!(warn && text));
}

function isBattleActive() {
  return el.battleScreen?.classList.contains("active") && state.running;
}

function setArmedCard(index) {
  const next = Number.isInteger(index) ? index : null;
  if (next === state.armedCardIndex) {
    state.armedCardIndex = null;
  } else {
    state.armedCardIndex = next;
  }
  updateLaneRecommendation();
  if (el.handIntel) el.handIntel.textContent = state.laneReco.text;
  renderCards();
  renderTimeline();
}

function clearArmedCard() {
  if (state.armedCardIndex === null) return;
  state.armedCardIndex = null;
  updateLaneRecommendation();
  if (el.handIntel) el.handIntel.textContent = state.laneReco.text;
  renderCards();
  renderTimeline();
}

function cardNeedsLaneTarget(card) {
  if (!card) return true;
  if (card.effect === "resource_card") return false;
  if (card.effect === "spell_spread_2" || card.effect === "spell_spread_3") return false;
  return true;
}

function getHandViewIndices() {
  return state.my.hand.map((card, idx) => ({ card, idx }));
}

function getActiveHandCardEntry() {
  if (Number.isInteger(state.armedCardIndex) && state.my.hand[state.armedCardIndex]) {
    return { card: state.my.hand[state.armedCardIndex], idx: state.armedCardIndex, mode: "armed" };
  }
  if (Number.isInteger(state.hoverCardIndex) && state.my.hand[state.hoverCardIndex]) {
    return { card: state.my.hand[state.hoverCardIndex], idx: state.hoverCardIndex, mode: "hover" };
  }
  return null;
}

function getMyLaneSnapshot(lane) {
  const enemyQueue = state.queue.filter((x) => x.from === "enemy" && x.lane === lane);
  const enemyFront = state.field.walls.filter((w) => w.owner === "enemy" && w.lane === lane && w.hp > 0);
  const enemyGens = state.field.generators.filter((g) => g.owner === "enemy" && g.lane === lane && g.hp > 0);
  const enemyTowers = state.field.arrowTowers.filter((t) => t.owner === "enemy" && t.lane === lane && t.hp > 0);
  const enemySummons = state.field.summons.filter((s) => s.owner === "enemy" && s.lane === lane && s.hp > 0);
  const myFront = state.field.walls.filter((w) => w.owner === "me" && w.lane === lane && w.hp > 0);
  const myTowers = state.field.arrowTowers.filter((t) => t.owner === "me" && t.lane === lane && t.hp > 0);
  const myGens = state.field.generators.filter((g) => g.owner === "me" && g.lane === lane && g.hp > 0);
  const hz = state.field.hazards[lane]?.type || "clear";
  return {
    enemyQueueSoon: enemyQueue.filter((q) => q.dueAt - state.gameTime <= 2.2).length,
    enemyBlock: enemyFront.length * 7 + enemyTowers.length * 8 + enemyGens.length * 5 + enemySummons.length * 4,
    myHold: myFront.length * 6 + myTowers.length * 7 + myGens.length * 4,
    hazard: hz,
    laneRef: getLaneRef(lane)
  };
}

function scoreMyCardOnLane(card, lane) {
  const laneInfo = getMyLaneSnapshot(lane);
  const laneRef = laneInfo.laneRef;
  let score = 0;
  const reasons = [];

  if (card.type === "attack") {
    const base = 8 + (card.power || 5) * 0.7;
    const blockPenalty = laneInfo.enemyBlock * 0.4;
    const queueBonus = laneInfo.enemyQueueSoon * 0.9;
    score += base - blockPenalty + queueBonus;
    if (queueBonus > 0) reasons.push("可压制即将结算的敌方行动体");
    if (blockPenalty > 6) reasons.push("敌方前排阻挡较强");
    if (laneRef.meNextBonus?.element === card.element) {
      score += 5;
      reasons.push("可吃到我方元素累计强化");
    }
    if (laneRef.meAura?.element === card.element && laneRef.meAura.expiresAt > state.gameTime) {
      score += 4;
      reasons.push("可吃到该线调谐增伤");
    }
    if (laneInfo.hazard === "blaze") {
      score += 1.4;
      reasons.push("地形灼热，伤害收益更高");
    }
    if (laneInfo.hazard === "frost") {
      score -= 1.2;
      reasons.push("地形霜冻，结算会偏慢");
    }
  } else if (card.type === "control" || card.type === "defense") {
    score += 6 + laneInfo.enemyQueueSoon * 2.2;
    if (laneInfo.enemyQueueSoon > 0) reasons.push("该线敌方行动体密度高，控制收益高");
    if (laneInfo.hazard === "frost") {
      score += 0.8;
      reasons.push("霜冻地形放大控制收益");
    }
  } else if (card.type === "utility") {
    if (card.effect?.startsWith("summon_")) {
      score += 7 - laneInfo.enemyBlock * 0.25 + laneInfo.myHold * 0.55;
      reasons.push(laneInfo.myHold >= 8 ? "我方该线站场较稳，召唤更易滚雪球" : "可补充该线场面单位");
    } else if (card.effect === "resource_card" || card.effect?.startsWith("gen_")) {
      const pool = state.my.resources[card.element];
      const lack = Math.max(0, 4.2 - pool.current);
      score += 3.5 + lack * 1.4;
      reasons.push("资源牌不依赖站场，优先回补当前缺口");
    } else if (card.effect === "trap_freeze" || card.effect === "trap_snare") {
      score += 5 + laneInfo.enemyQueueSoon * 1.8;
      reasons.push("敌方该线即将结算单位较多，陷阱收益高");
    } else if (card.effect?.startsWith("lane_")) {
      const oppStack = (laneRef.enemyTrack?.length || 0) + (laneRef.enemyNextBonus ? 2 : 0);
      score += 4 + oppStack * 1.5;
      reasons.push(oppStack > 0 ? "可打断敌方该线元素节奏" : "可提前建立通道优势");
    } else if (card.effect?.startsWith("tower_")) {
      const myTower = state.field.arrowTowers.find((t) => t.owner === "me" && t.lane === lane && t.hp > 0);
      score += myTower ? 7 : -4;
      if (myTower) score += (1 - myTower.hp / Math.max(1, myTower.maxHp || myTower.hp)) * 4;
      reasons.push(myTower ? "该线已有箭塔，可直接吃强化收益" : "该线无箭塔，强化卡收益受限");
    }
  }
  return { score, reason: reasons[0] || "该线综合收益更高" };
}

function updateLaneRecommendation() {
  const active = getActiveHandCardEntry();
  if (!active) {
    state.laneReco = { lanes: [], scoreByLane: [0, 0, 0], reasonByLane: ["", "", ""], text: "选中或悬停手牌后，将显示推荐出牌线。" };
    return;
  }
  const laneEval = Array.from({ length: LANE_COUNT }, (_, lane) => scoreMyCardOnLane(active.card, lane));
  const scoreByLane = laneEval.map((x) => x.score);
  const reasonByLane = laneEval.map((x) => x.reason);
  const ranked = scoreByLane
    .map((score, lane) => ({ lane, score }))
    .sort((a, b) => b.score - a.score);
  const top = ranked[0]?.score ?? 0;
  const lanes = ranked.filter((x) => top - x.score <= 1.3).slice(0, 2).map((x) => x.lane);
  const laneText = lanes.map((lane) => `${lane + 1}线`).join(" / ");
  const modeText = active.mode === "armed" ? "选中" : "悬停";
  const leadLane = lanes[0] ?? ranked[0]?.lane ?? 1;
  const leadReason = reasonByLane[leadLane] || "综合评分最高";
  state.laneReco = {
    lanes,
    scoreByLane,
    reasonByLane,
    text: `${modeText}【${active.card.name}】推荐：${laneText || "中线"}。原因：${leadReason}。按 Q/W/E 可快速落线。`
  };
}

function updateStartButtonState() {
  if (!el.btnStart) return;
  const deckCount = getDeckCount();
  const minNeed = state.deckBuilder.minSize;
  const maxLimit = state.deckBuilder.maxSize;
  let text = "进入战斗";
  let notice = "";
  let warn = false;
  let disabled = false;

  if (net.mode === "local") {
    if (deckCount > maxLimit) {
      notice = `卡组超限：当前 ${deckCount} 张，最多 ${maxLimit} 张。`;
      warn = true;
      disabled = true;
    } else if (deckCount < minNeed) {
      notice = `卡组不足：当前 ${deckCount} 张，至少需要 ${minNeed} 张。`;
      warn = true;
    }
  } else if (!net.connected) {
    notice = "联机模式：请先创建或加入房间。";
    warn = true;
  } else if (net.role !== "host") {
    text = net.myReady ? "取消准备" : "准备";
    notice = net.myReady ? "已准备，等待房主开始战斗。" : "点击准备，等待房主开始战斗。";
  } else if (deckCount > maxLimit) {
    notice = `卡组超限：当前 ${deckCount} 张，最多 ${maxLimit} 张。`;
    warn = true;
    disabled = true;
  } else if (deckCount < minNeed) {
    notice = `卡组不足：当前 ${deckCount} 张，至少需要 ${minNeed} 张。`;
    warn = true;
  } else if (!(net.peerOnline || net.peerCount >= 2)) {
    notice = "等待对手加入房间。";
    warn = true;
  } else if (!net.peerReady) {
    notice = net.myReady ? "你已准备，等待对手准备。" : "对手未准备，点击开始后将进入等待。";
  } else {
    notice = "双方已准备，可开始战斗。";
  }

  el.btnStart.textContent = text;
  el.btnStart.disabled = disabled;
  setPrepNotice(notice, warn);
}

function refreshNetUI() {
  if (el.netOnlineBox) el.netOnlineBox.style.display = net.mode === "online" ? "block" : "none";
  if (el.roomCodeText) el.roomCodeText.textContent = net.roomCode ? `房间码：${net.roomCode}` : "";
  syncInviteLink();
  if (el.btnModeLocal) el.btnModeLocal.classList.toggle("btn-primary", net.mode === "local");
  if (el.btnModeOnline) el.btnModeOnline.classList.toggle("btn-primary", net.mode === "online");
  updateLobbyBoard();
  updateStartButtonState();
  updateBattleControlState();
}

function updateBattleControlState() {
  document.body.classList.toggle("theme-cartoon-vivid", state.cartoonTheme === "vivid");
  if (el.btnThemeCartoon) {
    el.btnThemeCartoon.textContent = `风格：${state.cartoonTheme === "vivid" ? "鲜明" : "柔和"}`;
  }
  if (el.aiDifficulty) {
    el.aiDifficulty.value = state.aiDifficulty;
    el.aiDifficulty.disabled = isOnlineMode();
    el.aiDifficulty.title = isOnlineMode() ? "联机模式下由房主战局决定" : "";
  }
  if (el.battleSpeed) {
    el.battleSpeed.value = String(state.simSpeed);
    const lockSpeed = isOnlineMode();
    el.battleSpeed.disabled = lockSpeed;
    el.battleSpeed.title = lockSpeed ? "联机模式固定为 1.0x" : "";
  }
  if (el.btnFxLite) {
    el.btnFxLite.textContent = `简化特效：${state.reducedFx ? "开" : "关"}`;
    el.btnFxLite.classList.toggle("btn-primary", state.reducedFx);
  }
  document.body.classList.toggle("reduced-fx", !!state.reducedFx);
}

function switchToLocalMode() {
  net.mode = "local";
  net.connected = false;
  net.wsConnected = false;
  net.role = "";
  net.roomCode = "";
  net.playerId = "";
  net.peerCount = 1;
  net.peerOnline = false;
  net.myReady = false;
  net.peerReady = false;
  net.myRematch = false;
  net.peerRematch = false;
  stopNetSocket();
  net.pollSince = 0;
  stopNetPolling();
  setNetStatus("单机模式");
  pushLobbyEvent("切换到单机模式。");
  if (el.btnNext) el.btnNext.disabled = false;
  refreshNetUI();
}

function switchToOnlineMode() {
  net.mode = "online";
  if (window.location.protocol === "file:") {
    setNetStatus("请通过 http://localhost:8080 打开页面");
    setPrepNotice("当前是 file:// 打开，联机接口不可用。请先运行 node server.js 并访问 http://localhost:8080。", true);
    pushLobbyEvent("联机不可用：请使用 http://localhost:8080 打开。");
  } else {
    setNetStatus("联机模式，先创建或加入房间");
    setPrepNotice("未连接房间时，点击“进入战斗”会自动创建房间。", false);
  }
  pushLobbyEvent("切换到联机模式。");
  refreshNetUI();
}

async function createOnlineRoom() {
  if (net.mode !== "online") switchToOnlineMode();
  let data;
  try {
    data = await apiPost("/api/create", {});
  } catch (e) {
    setNetStatus(e?.message || "创建失败");
    setPrepNotice(e?.message || "创建失败。", true);
    pushLobbyEvent(`创建房间失败：${e?.message || "网络异常"}`);
    return;
  }
  if (!data?.ok) {
    const msg = data?.error || "创建失败";
    setNetStatus(msg);
    setPrepNotice(msg, true);
    pushLobbyEvent(`创建房间失败：${msg}`);
    return;
  }
  net.connected = true;
  net.role = "host";
  net.roomCode = data.roomCode;
  net.playerId = data.playerId;
  net.myReady = false;
  net.peerReady = false;
  net.myRematch = false;
  net.peerRematch = false;
  net.pollSince = 0;
  setNetStatus("已建房，等待对手加入");
  pushLobbyEvent(`房间创建成功：${data.roomCode}`);
  try {
    const u = new URL(window.location.href);
    u.searchParams.set("room", data.roomCode);
    window.history.replaceState({}, "", u.toString());
  } catch (_) {
    // Ignore URL rewrite errors.
  }
  refreshNetUI();
  connectNetSocket();
}

async function joinOnlineRoom() {
  const code = (el.joinRoomCode?.value || "").trim().toUpperCase();
  if (!code) {
    setNetStatus("请先输入房间码");
    pushLobbyEvent("加入失败：未输入房间码。");
    return;
  }
  if (net.mode !== "online") switchToOnlineMode();
  let data;
  try {
    data = await apiPost("/api/join", { roomCode: code });
  } catch (e) {
    setNetStatus(e?.message || "加入失败");
    setPrepNotice(e?.message || "加入失败。", true);
    pushLobbyEvent(`加入失败：${e?.message || "网络异常"}`);
    return;
  }
  if (!data?.ok) {
    const msg = data?.error || "加入失败";
    setNetStatus(msg);
    setPrepNotice(msg, true);
    pushLobbyEvent(`加入失败：${msg}`);
    return;
  }
  net.connected = true;
  net.role = "guest";
  net.roomCode = data.roomCode;
  net.playerId = data.playerId;
  net.myReady = false;
  net.peerReady = false;
  net.myRematch = false;
  net.peerRematch = false;
  net.pollSince = 0;
  setNetStatus("已加入，等待房主开始");
  pushLobbyEvent(`加入房间成功：${data.roomCode}`);
  try {
    const u = new URL(window.location.href);
    u.searchParams.set("room", data.roomCode);
    window.history.replaceState({}, "", u.toString());
  } catch (_) {
    // Ignore URL rewrite errors.
  }
  refreshNetUI();
  connectNetSocket();
}

async function apiPost(path, body) {
  try {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body || {})
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.ok === false) {
      throw new Error(data?.error || `请求失败(${res.status})`);
    }
    return data;
  } catch (_) {
    if (window.location.protocol === "file:") {
      throw new Error("请先运行 node server.js，并通过 http://localhost:8080 打开页面。");
    }
    throw new Error("连接服务器失败，请确认已运行 node server.js。");
  }
}

async function apiPoll() {
  const u = `/api/poll?roomCode=${encodeURIComponent(net.roomCode)}&playerId=${encodeURIComponent(net.playerId)}&since=${encodeURIComponent(net.pollSince)}`;
  const res = await fetch(u);
  return res.json();
}

function swapOwner(v) {
  return v === "me" ? "enemy" : v === "enemy" ? "me" : v;
}

function swapSnapshotPerspective(s) {
  const out = JSON.parse(JSON.stringify(s));
  [out.myHp, out.enemyHp] = [out.enemyHp, out.myHp];
  [out.my, out.enemy] = [out.enemy, out.my];
  [out.myCastLockUntil, out.enemyCastLockUntil] = [out.enemyCastLockUntil, out.myCastLockUntil];
  out.queue = (out.queue || []).map((q) => ({ ...q, from: swapOwner(q.from) }));
  if (out.field) {
    ["walls", "generators", "summons", "traps", "arrowTowers", "arrowShots"].forEach((k) => {
      out.field[k] = (out.field[k] || []).map((x) => ({ ...x, owner: swapOwner(x.owner) }));
    });
    (out.field.lanes || []).forEach((lane) => {
      [lane.meTrack, lane.enemyTrack] = [lane.enemyTrack, lane.meTrack];
      [lane.meNextBonus, lane.enemyNextBonus] = [lane.enemyNextBonus, lane.meNextBonus];
      [lane.meAura, lane.enemyAura] = [lane.enemyAura, lane.meAura];
    });
  }
  return out;
}

function buildNetSnapshot() {
  return {
    myHp: state.myHp,
    enemyHp: state.enemyHp,
    gameTime: state.gameTime,
    queue: state.queue,
    env: state.env,
    field: state.field,
    my: state.my,
    enemy: state.enemy,
    drawTimer: state.drawTimer,
    battlefieldEvent: state.battlefieldEvent,
    myCastLockUntil: state.myCastLockUntil,
    enemyCastLockUntil: state.enemyCastLockUntil,
    running: state.running
  };
}

function applyNetSnapshot(snapshot) {
  const s = net.role === "guest" ? swapSnapshotPerspective(snapshot) : snapshot;
  state.myHp = s.myHp;
  state.enemyHp = s.enemyHp;
  state.gameTime = s.gameTime;
  state.queue = s.queue || [];
  state.env = s.env || state.env;
  state.field = s.field || state.field;
  state.my = s.my || state.my;
  state.enemy = s.enemy || state.enemy;
  state.drawTimer = s.drawTimer || 0;
  state.battlefieldEvent = s.battlefieldEvent || state.battlefieldEvent;
  state.myCastLockUntil = s.myCastLockUntil || 0;
  state.enemyCastLockUntil = s.enemyCastLockUntil || 0;
  state.running = !!s.running;
  render();
}

async function netSend(type, payload) {
  if (!isOnlineMode()) return;
  if (net.wsConnected && net.ws && net.ws.readyState === WebSocket.OPEN) {
    try {
      net.ws.send(JSON.stringify({ type, payload: payload || {} }));
      return;
    } catch (_) {
      // Fall through to HTTP fallback.
    }
  }
  await apiPost("/api/send", {
    roomCode: net.roomCode,
    playerId: net.playerId,
    type,
    payload: payload || {}
  });
}

function stopNetPolling() {
  if (net.pollTimer) clearTimeout(net.pollTimer);
  net.pollTimer = null;
}

function stopNetSocket() {
  if (net.wsRetryTimer) clearTimeout(net.wsRetryTimer);
  net.wsRetryTimer = null;
  if (net.ws) {
    try { net.ws.close(); } catch (_) {}
  }
  net.ws = null;
  net.wsConnected = false;
}

function updateReadyStatusLine() {
  if (!isOnlineMode()) return;
  const r1 = net.myReady ? "已准备" : "未准备";
  const r2 = net.peerReady ? "已准备" : "未准备";
  const link = net.wsConnected ? "WebSocket" : "轮询";
  setNetStatus(`联机中(${link}) | 我:${r1} 对手:${r2}`);
}

function setMyReady(ready) {
  net.myReady = !!ready;
  updateReadyStatusLine();
  updateStartButtonState();
  updateLobbyBoard();
  pushLobbyEvent(net.myReady ? "我方已准备。" : "我方取消准备。");
  netSend("ready", { ready: net.myReady });
}

function handleNetEvent(e) {
  if (!e) return;
  if (typeof e.seq === "number") net.pollSince = Math.max(net.pollSince, e.seq);
  if (e.type === "peer_joined") {
    net.peerCount = 2;
    net.peerOnline = true;
    setNetStatus("对手已加入");
    pushLobbyEvent("有玩家加入房间。");
    updateLobbyBoard();
    updateStartButtonState();
    return;
  }
  if (e.type === "peer_connected") {
    const pid = e.payload?.playerId || "";
    if (pid && pid !== net.playerId) {
      net.peerOnline = true;
      updateReadyStatusLine();
      pushLobbyEvent("对手已连接。");
      updateLobbyBoard();
      updateStartButtonState();
    }
    return;
  }
  if (e.type === "peer_disconnected") {
    const pid = e.payload?.playerId || "";
    if (pid && pid !== net.playerId) {
      net.peerOnline = false;
      net.peerReady = false;
      setNetStatus("对手断线，等待重连");
      pushLobbyEvent("对手断线。");
      updateLobbyBoard();
      updateStartButtonState();
    }
    return;
  }
  if (e.type === "ready") {
    const ready = !!e.payload?.ready;
    if (e.from !== net.playerId) {
      net.peerReady = ready;
      pushLobbyEvent(ready ? "对手已准备。" : "对手取消准备。");
    } else {
      net.myReady = ready;
    }
    updateReadyStatusLine();
    updateLobbyBoard();
    updateStartButtonState();
    return;
  }
  if (e.type === "battle_start") {
    net.myRematch = false;
    net.peerRematch = false;
    if (net.role === "guest") {
      setScreen("battle");
      state.running = true;
      el.btnNext.textContent = "联机中";
      el.btnNext.disabled = true;
      logLine("联机战斗开始。你是右侧玩家。");
    }
    pushLobbyEvent("战斗已开始。");
    updateLobbyBoard();
    updateStartButtonState();
    return;
  }
  if (e.type === "battle_over") {
    const winner = e.payload?.winner || "draw";
    finishBattle(winner, true);
    return;
  }
  if (e.type === "snapshot") {
    applyNetSnapshot(e.payload?.state || {});
    return;
  }
  if (e.type === "play" && net.role === "host") {
    const p = e.payload || {};
    playEnemyCardByIndex(p.index, p.target || { type: "lane", lane: 1, pos: 20 });
    return;
  }
  if (e.type === "rematch_ready") {
    const ready = !!e.payload?.ready;
    if (e.from !== net.playerId) net.peerRematch = ready;
    else net.myRematch = ready;
    pushLobbyEvent(ready ? "有人确认再来一局。" : "有人取消再来一局。");
    if (net.role === "host" && net.myRematch && net.peerRematch) {
      net.myReady = true;
      net.peerReady = true;
      updateLobbyBoard();
      resetBattle();
    }
  }
}

function scheduleWsReconnect() {
  if (!isOnlineMode()) return;
  if (net.wsRetryTimer) clearTimeout(net.wsRetryTimer);
  const wait = Math.min(2000, 300 + net.wsRetryCount * 250);
  net.wsRetryTimer = setTimeout(() => connectNetSocket(), wait);
}

function connectNetSocket() {
  if (!isOnlineMode()) return;
  stopNetSocket();
  stopNetPolling();
  if (!("WebSocket" in window)) {
    setNetStatus("浏览器不支持WebSocket，使用轮询");
    pushLobbyEvent("浏览器不支持WebSocket，已切换轮询。");
    startNetPolling();
    return;
  }
  const proto = window.location.protocol === "https:" ? "wss" : "ws";
  const wsUrl = `${proto}://${window.location.host}/ws?roomCode=${encodeURIComponent(net.roomCode)}&playerId=${encodeURIComponent(net.playerId)}`;
  const ws = new WebSocket(wsUrl);
  net.ws = ws;
  ws.onopen = () => {
    net.wsConnected = true;
    net.wsRetryCount = 0;
    pushLobbyEvent("WebSocket连接成功。");
    updateLobbyBoard();
    updateReadyStatusLine();
  };
  ws.onmessage = (ev) => {
    let msg;
    try {
      msg = JSON.parse(ev.data);
    } catch (_) {
      return;
    }
    if (msg.type === "hello") {
      net.peerCount = Number(msg.peers || 1);
      net.peerOnline = net.peerCount >= 2;
      if (typeof msg.nowSeq === "number") net.pollSince = msg.nowSeq;
      updateLobbyBoard();
      updateReadyStatusLine();
      return;
    }
    if (msg.event) handleNetEvent(msg.event);
  };
  ws.onerror = () => {};
  ws.onclose = () => {
    net.wsConnected = false;
    net.wsRetryCount += 1;
    if (isOnlineMode()) {
      setNetStatus("WebSocket断开，尝试重连");
      pushLobbyEvent("WebSocket断开，尝试重连。");
      updateLobbyBoard();
      if (net.wsRetryCount <= 8) {
        scheduleWsReconnect();
      } else {
        setNetStatus("WebSocket重连失败，切换轮询");
        pushLobbyEvent("WebSocket重连失败，切换轮询。");
        startNetPolling();
      }
    }
  };
}

async function startNetPolling() {
  stopNetPolling();
  const loop = async () => {
    if (!isOnlineMode()) return;
    try {
      const data = await apiPoll();
      if (data?.ok) {
        net.pollSince = data.nowSeq || net.pollSince;
        net.peerCount = Number(data.peers || net.peerCount);
        net.peerOnline = net.peerCount >= 2;
        for (const e of data.events || []) {
          handleNetEvent(e);
        }
      }
    } catch (_) {
      setNetStatus("联机轮询失败，正在重试");
    }
    net.pollTimer = setTimeout(loop, 220);
  };
  loop();
}

function setScreen(mode) {
  const prep = mode === "prep";
  if (el.prepScreen) el.prepScreen.classList.toggle("active", prep);
  if (el.battleScreen) el.battleScreen.classList.toggle("active", !prep);
}

function syncDrawerButton(drawer) {
  const btn = drawer.querySelector("[data-drawer-toggle]");
  if (!btn) return;
  const open = drawer.classList.contains("open");
  btn.textContent = open ? "收起" : "展开";
  btn.setAttribute("aria-expanded", open ? "true" : "false");
}

function toggleDrawer(drawer) {
  drawer.classList.toggle("open");
  syncDrawerButton(drawer);
  syncTopDrawerButtons();
}

function syncTopDrawerButtons() {
  const decisionOpen = !!document.querySelector('.battle-side [data-drawer="decision"]')?.classList.contains("open");
  const logOpen = !!document.querySelector('.battle-side [data-drawer="log"]')?.classList.contains("open");
  if (el.btnDecisionPanel) el.btnDecisionPanel.classList.toggle("active", decisionOpen);
  if (el.btnLogPanel) el.btnLogPanel.classList.toggle("active", logOpen);
}

function initBattleDrawers() {
  const drawers = document.querySelectorAll(".battle-side .drawer");
  drawers.forEach((drawer) => {
    const btn = drawer.querySelector("[data-drawer-toggle]");
    if (!btn) return;
    syncDrawerButton(drawer);
    btn.addEventListener("click", () => toggleDrawer(drawer));
  });
  if (el.btnDecisionPanel) {
    el.btnDecisionPanel.addEventListener("click", () => {
      const drawer = document.querySelector('.battle-side [data-drawer="decision"]');
      if (!drawer) return;
      toggleDrawer(drawer);
    });
  }
  if (el.btnLogPanel) {
    el.btnLogPanel.addEventListener("click", () => {
      const drawer = document.querySelector('.battle-side [data-drawer="log"]');
      if (!drawer) return;
      toggleDrawer(drawer);
    });
  }
  syncTopDrawerButtons();
}

function createResourceState() {
  return {
    wood: { current: 2.2, max: 8 },
    fire: { current: 2.2, max: 8 },
    earth: { current: 2.2, max: 8 },
    metal: { current: 2.2, max: 8 },
    water: { current: 2.2, max: 8 }
  };
}

function cloneCardById(id) {
  const base = CARD_POOL.find((x) => x.id === id);
  return { ...base, cost: { ...base.cost } };
}

function makeDeck(ids = DEFAULT_DECK_IDS) {
  const deck = ids.map(cloneCardById).filter(Boolean);
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function buildCountsFromIds(ids) {
  const out = {};
  ids.forEach((id) => {
    out[id] = (out[id] || 0) + 1;
  });
  return out;
}

function expandDeckIdsFromCounts(counts) {
  const ids = [];
  CARD_POOL.forEach((c) => {
    const n = Math.max(0, Math.floor(counts[c.id] || 0));
    for (let i = 0; i < n; i++) ids.push(c.id);
  });
  return ids;
}

function getDeckCount() {
  return Object.values(state.deckBuilder.counts || {}).reduce((sum, n) => sum + Math.max(0, Math.floor(n || 0)), 0);
}

function setDeckToDefault() {
  state.deckBuilder.counts = clampDeckCountsToMax(buildCountsFromIds(DEFAULT_DECK_IDS));
}

function classifyCardProfile(card) {
  if (!card) return "other";
  if (card.effect?.startsWith("summon_")) return "summon";
  if (card.effect === "resource_card") return "generator";
  if (card.effect?.startsWith("gen_")) return "generator";
  if (card.effect?.startsWith("lane_")) return "lane";
  if (card.effect?.startsWith("spell_spread_")) return "support";
  if (card.type === "attack") return "attack";
  if (card.type === "control" || card.type === "defense") return "control";
  return "other";
}

function recordPlayerPattern(card) {
  const tag = classifyCardProfile(card);
  state.aiRead.recent.push(tag);
  if (state.aiRead.recent.length > state.aiRead.window) {
    state.aiRead.recent.shift();
  }
}

function getPlayerPatternWeights() {
  const seq = state.aiRead.recent;
  if (!seq.length) return { summon: 0, generator: 0, attack: 0, lane: 0, support: 0, control: 0 };
  const counts = { summon: 0, generator: 0, attack: 0, lane: 0, support: 0, control: 0, other: 0 };
  seq.forEach((x) => { counts[x] = (counts[x] || 0) + 1; });
  const n = seq.length;
  return {
    summon: counts.summon / n,
    generator: counts.generator / n,
    attack: counts.attack / n,
    lane: counts.lane / n,
    support: counts.support / n,
    control: counts.control / n
  };
}

function sanitizeDeckCounts(rawCounts) {
  const out = {};
  const ids = new Set(CARD_POOL.map((c) => c.id));
  Object.entries(rawCounts || {}).forEach(([id, count]) => {
    if (!ids.has(id)) return;
    const n = Math.max(0, Math.min(state.deckBuilder.maxPerCard, Math.floor(Number(count) || 0)));
    if (n > 0) out[id] = n;
  });
  return clampDeckCountsToMax(out);
}

function clampDeckCountsToMax(counts) {
  const out = { ...(counts || {}) };
  let total = Object.values(out).reduce((sum, n) => sum + Math.max(0, Math.floor(n || 0)), 0);
  if (total <= state.deckBuilder.maxSize) return out;
  const order = CARD_POOL.map((c) => c.id);
  for (let i = order.length - 1; i >= 0 && total > state.deckBuilder.maxSize; i--) {
    const id = order[i];
    let n = Math.max(0, Math.floor(out[id] || 0));
    while (n > 0 && total > state.deckBuilder.maxSize) {
      n -= 1;
      total -= 1;
    }
    if (n > 0) out[id] = n;
    else delete out[id];
  }
  return out;
}

function saveDeckBuilderCache() {
  try {
    localStorage.setItem(DECK_CACHE_KEY, JSON.stringify(state.deckBuilder.counts || {}));
  } catch (_) {
    // Ignore storage failures in restricted environments.
  }
}

function loadDeckBuilderCache() {
  try {
    const raw = localStorage.getItem(DECK_CACHE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    const clean = sanitizeDeckCounts(parsed);
    if (Object.keys(clean).length === 0) return false;
    state.deckBuilder.counts = clean;
    return true;
  } catch (_) {
    return false;
  }
}

function randomEnv(power) {
  const type = ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)];
  return { type, power };
}

function slotToPos(slot) {
  const step = (LANE_RIGHT - LANE_LEFT) / (LANE_TILE_COUNT - 1);
  const s = Math.max(0, Math.min(LANE_TILE_COUNT - 1, slot));
  return LANE_LEFT + step * s;
}

function posToSlot(pos) {
  const step = (LANE_RIGHT - LANE_LEFT) / (LANE_TILE_COUNT - 1);
  const raw = (Math.max(LANE_LEFT, Math.min(LANE_RIGHT, pos)) - LANE_LEFT) / step;
  return Math.max(0, Math.min(LANE_TILE_COUNT - 1, Math.round(raw)));
}

function createArrowTower(owner, lane) {
  const enemySide = owner === "me" ? false : true;
  const slot = enemySide ? LANE_TILE_COUNT - 1 : 0;
  const pos = slotToPos(slot);
  return {
    id: `tower-${owner}-${lane}`,
    owner,
    lane,
    slot,
    pos,
    hp: 20,
    maxHp: 20,
    atk: 2.8,
    range: 30,
    hitCd: 1.05,
    nextHitAt: 0,
    lastHitAt: -999
  };
}

function createArrowTowerState() {
  return Array.from({ length: LANE_COUNT * 2 }, (_, i) => {
    const owner = i < LANE_COUNT ? "me" : "enemy";
    const lane = i % LANE_COUNT;
    return createArrowTower(owner, lane);
  });
}

function logLine(text) {
  const stamp = `[${state.gameTime.toFixed(1)}s]`;
  state.logLines.unshift(`${stamp} ${text}`);
  if (state.logLines.length > state.maxLogLines) {
    state.logLines.length = state.maxLogLines;
  }
  if (el.log) el.log.textContent = state.logLines.join("\n");
}

function pushDecision(entry) {
  const score = (entry.damage || 0) + (entry.prevent || 0) + (entry.resource || 0) * 2 + (entry.cd || 0) * 4;
  state.decisionFeed.unshift({
    time: state.gameTime.toFixed(1),
    title: entry.title || "行动",
    damage: entry.damage || 0,
    prevent: entry.prevent || 0,
    resource: entry.resource || 0,
    cd: entry.cd || 0,
    note: entry.note || "",
    good: score >= 0
  });
  state.decisionFeed = state.decisionFeed.slice(0, 3);
}

function resetBattle() {
  if (isOnlineMode() && net.role === "host" && !net.peerReady) {
    setNetStatus("对手未准备，无法开始");
    setPrepNotice("对手未准备，无法开始。", true);
    return;
  }
  const myDeckIds = expandDeckIdsFromCounts(state.deckBuilder.counts);
  if (myDeckIds.length < state.deckBuilder.minSize) {
    setPrepNotice(`卡组不足：当前 ${myDeckIds.length} 张，至少需要 ${state.deckBuilder.minSize} 张。`, true);
    logLine(`卡组数量不足：当前 ${myDeckIds.length} 张，至少需要 ${state.deckBuilder.minSize} 张。`);
    return;
  }
  setPrepNotice("");
  state.myHp = 100;
  state.enemyHp = 100;
  state.gameTime = 0;
  state.queue = [];
  state.drawTimer = 0;
  state.enemyThinkTimer = 0;
  state.envDecayTimer = 0;
  state.eventTimer = 0;
  state.eventIndex = Math.floor(Math.random() * EVENT_ROTATION.length);
  state.battlefieldEvent = EVENT_ROTATION[state.eventIndex];
  state.pendingCast = false;
  state.dragCardIndex = null;
  state.pointerDragging = false;
  state.enemyProjectileTrack = [];
  state.field = {
    walls: [],
    generators: [],
    summons: [],
    traps: [],
    arrowTowers: createArrowTowerState(),
    arrowShots: [],
    hazards: [],
    lanes: createLaneState()
  };
  state.hazardTimer = 0;
  clearDragPreview();
  state.castFxUntil = 0;
  state.myCastLockUntil = 0;
  state.enemyCastLockUntil = 0;
  state.myDiscardLockUntil = 0;
  state.hitFx = { my: 0, enemy: 0 };
  state.floatTexts = [];
  state.decisionFeed = [];
  state.aiRead.recent = [];
  state.sharedRecentElements = [];
  hideResultModal();
  state.my.deck = makeDeck(myDeckIds);
  state.my.hand = [];
  state.my.discard = [];
  state.enemy.deck = makeDeck(DEFAULT_DECK_IDS);
  state.enemy.hand = [];
  state.enemy.discard = [];
  state.my.resources = createResourceState();
  state.enemy.resources = createResourceState();
  state.my.combo = { key: "", expiresAt: 0 };
  state.enemy.combo = { key: "", expiresAt: 0 };
  state.my.nextAttackSpread = 1;
  state.enemy.nextAttackSpread = 1;
  state.env.main = randomEnv(3);
  state.env.sub = randomEnv(2);
  net.myRematch = false;
  net.peerRematch = false;
  state.logLines = [];
  if (el.log) el.log.textContent = "";
  setScreen("battle");
  drawCards("my", 5);
  drawCards("enemy", 5);
  rollLaneHazards();
  logLine(`当前AI难度：${getAiProfile().label}。`);
  logLine(`地形异常：${state.field.hazards.map((h, i) => `第${i + 1}线${hazardName(h.type)}`).join(" / ")}`);
  logLine(`战场事件生效：${state.battlefieldEvent.name}（${state.battlefieldEvent.desc}）`);
  logLine("实时战斗开始。双方可随时出牌，五行资源随时间恢复。" );
  playIntroOverlay();
  if (introTimer) clearTimeout(introTimer);
  introTimer = setTimeout(() => {
    startLoop();
    introTimer = null;
  }, 850);
  if (isOnlineMode() && net.role === "host") {
    netSend("battle_start", {});
    netSend("snapshot", { state: buildNetSnapshot() });
    setMyReady(false);
    net.peerReady = false;
    setNetStatus("联机对战进行中（你是房主）");
  }
  render();
}

function startLoop() {
  stopLoop();
  state.running = true;
  state.lastStamp = 0;
  el.btnNext.textContent = "暂停";
  state.rafId = requestAnimationFrame(loop);
}

function stopLoop() {
  if (state.rafId) cancelAnimationFrame(state.rafId);
  state.rafId = null;
}

function togglePause() {
  if (isOnlineMode()) {
    setNetStatus("联机模式不支持本地暂停");
    return;
  }
  if (!state.running) {
    state.running = true;
    state.lastStamp = 0;
    el.btnNext.textContent = "暂停";
    state.rafId = requestAnimationFrame(loop);
    logLine("已继续实时演算。");
    return;
  }
  state.running = false;
  stopLoop();
  el.btnNext.textContent = "继续";
  logLine("已暂停实时演算。");
}

function loop(timestamp) {
  if (!state.running) return;
  if (state.lastStamp === 0) state.lastStamp = timestamp;
  const speedMul = isOnlineMode() ? 1 : state.simSpeed;
  const dt = Math.min(0.2, (timestamp - state.lastStamp) / 1000 * speedMul);
  state.lastStamp = timestamp;

  stepSimulation(dt);
  renderRuntime();

  state.rafId = requestAnimationFrame(loop);
}

function stepSimulation(dt) {
  const simDt = state.dragCardIndex !== null ? dt * 0.25 : dt;
  state.gameTime += simDt;
  state.floatTexts = state.floatTexts.filter((x) => x.expiresAt > state.gameTime);

  state.drawTimer += simDt;
  if (state.drawTimer >= state.my.drawCooldown) {
    state.drawTimer = 0;
    drawCards("my", 1);
    drawCards("enemy", 1);
  }

  state.enemyThinkTimer += simDt;
  if (!isOnlineMode() && state.enemyThinkTimer >= getAiProfile().thinkInterval) {
    state.enemyThinkTimer = 0;
    enemyPlayLogic();
  }

  state.envDecayTimer += simDt;
  if (state.envDecayTimer >= 8) {
    state.envDecayTimer = 0;
    decayEnvironment();
  }

  state.eventTimer += simDt;
  if (state.eventTimer >= 20) {
    state.eventTimer = 0;
    rotateBattlefieldEvent();
  }

  state.hazardTimer += simDt;
  if (state.hazardTimer >= 18) {
    state.hazardTimer = 0;
    rollLaneHazards();
    logLine(`地形异常轮转：${state.field.hazards.map((h, i) => `第${i + 1}线${hazardName(h.type)}`).join(" / ")}`);
  }

  processLaneHazards(simDt);
  processLaneTraps();
  processArrowTowers(simDt);
  processSummons(simDt);
  executeDueActions();

  if (isOnlineMode() && net.role === "host") {
    net.snapshotAcc += simDt;
    if (net.snapshotAcc >= 0.2) {
      net.snapshotAcc = 0;
      netSend("snapshot", { state: buildNetSnapshot() });
    }
  }
}

function hazardName(type) {
  if (type === "frost") return "霜冻减速";
  if (type === "blaze") return "灼热点燃";
  return "平地";
}

function rollLaneHazards() {
  const pool = ["clear", "clear", "frost", "blaze"];
  state.field.hazards = Array.from({ length: LANE_COUNT }, () => ({
    type: pool[Math.floor(Math.random() * pool.length)]
  }));
}

function processLaneHazards(dt) {
  state.queue.forEach((act) => {
    const hz = state.field.hazards[act.lane]?.type || "clear";
    if (hz === "frost") {
      act.dueAt += dt * 0.28;
    } else if (hz === "blaze") {
      if (act.type === "attack") {
        act.hazardBonus = Math.min(4, (act.hazardBonus || 0) + dt * 0.9);
      } else {
        act.dueAt += dt * 0.08;
      }
    }
  });
}

function processLaneTraps() {
  state.queue.forEach((act) => {
    if (!act.trapTriggers || !act.trapTriggers.length) return;
    act.trapTriggers.forEach((t) => {
      if (t.fired || state.gameTime < t.triggerAt) return;
      t.fired = true;
      const trap = state.field.traps.find((x) => x.id === t.trapId);
      if (!trap || trap.charges <= 0) return;
      trap.charges -= 1;
      if (trap.effect === "trap_freeze") {
        act.dueAt += 1.2;
        logLine(`${trap.owner === "me" ? "我方" : "敌方"}冰霜陷阱触发：${act.name}被冻结减速。`);
      } else if (trap.effect === "trap_snare") {
        if ((act.power || 0) <= 10) {
          act.captured = true;
          logLine(`${trap.owner === "me" ? "我方" : "敌方"}缚灵陷阱触发：${act.name}被直接捕获。`);
        } else {
          act.power = Math.max(0, (act.power || 0) - 4);
          act.dueAt += 0.9;
          logLine(`${trap.owner === "me" ? "我方" : "敌方"}缚灵陷阱触发：${act.name}被削弱并减速。`);
        }
      }
      if (trap.charges <= 0) {
        state.field.traps = state.field.traps.filter((x) => x.id !== trap.id);
      }
    });
  });
  state.queue = state.queue.filter((q) => !q.captured);
}

function processArrowTowers(dt) {
  if (!state.field.arrowTowers) state.field.arrowTowers = createArrowTowerState();
  if (!state.field.arrowShots) state.field.arrowShots = [];
  state.field.arrowShots = state.field.arrowShots.filter((x) => x.expiresAt > state.gameTime);

  state.field.arrowTowers.forEach((tower) => {
    if (tower.hp <= 0) return;
    const enemyOwner = tower.owner === "me" ? "enemy" : "me";
    const inRange = state.field.summons
      .filter((s) => s.owner === enemyOwner && s.lane === tower.lane && s.hp > 0)
      .filter((s) => Math.abs(s.pos - tower.pos) <= tower.range)
      .sort((a, b) => Math.abs(a.pos - tower.pos) - Math.abs(b.pos - tower.pos))[0];
    if (!inRange) return;
    if (state.gameTime < tower.nextHitAt) return;
    tower.nextHitAt = state.gameTime + tower.hitCd;
    tower.lastHitAt = state.gameTime;
    inRange.hp = Math.max(0, inRange.hp - tower.atk);
    inRange.lastHitAt = state.gameTime;
    state.field.arrowShots.push({
      id: `shot-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      lane: tower.lane,
      fromPos: tower.pos,
      toPos: inRange.pos,
      owner: tower.owner,
      expiresAt: state.gameTime + 0.2
    });
    if (Math.random() < 0.2) {
      logLine(`${tower.owner === "me" ? "我方" : "敌方"}箭塔命中${inRange.name}，造成 ${tower.atk.toFixed(1)} 点伤害。`);
    }
  });
  state.field.summons = state.field.summons.filter((s) => s.hp > 0);
}

function findFrontStructureForSummon(summon) {
  const enemy = summon.owner === "me" ? "enemy" : "me";
  const structures = [
    ...state.field.walls.filter((w) => w.owner === enemy && w.lane === summon.lane && w.hp > 0).map((w) => ({ kind: "wall", ref: w, pos: w.pos })),
    ...state.field.generators.filter((g) => g.owner === enemy && g.lane === summon.lane && g.hp > 0).map((g) => ({ kind: "gen", ref: g, pos: g.pos })),
    ...state.field.arrowTowers.filter((t) => t.owner === enemy && t.lane === summon.lane && t.hp > 0).map((t) => ({ kind: "tower", ref: t, pos: t.pos }))
  ];
  if (!structures.length) return null;
  if (summon.owner === "me") {
    const ahead = structures.filter((s) => s.pos >= summon.pos - 0.5).sort((a, b) => a.pos - b.pos);
    return ahead[0] || null;
  }
  const ahead = structures.filter((s) => s.pos <= summon.pos + 0.5).sort((a, b) => b.pos - a.pos);
  return ahead[0] || null;
}

function findFrontEnemySummon(summon) {
  const enemy = summon.owner === "me" ? "enemy" : "me";
  const list = state.field.summons
    .filter((x) => x.owner === enemy && x.lane === summon.lane && x.hp > 0);
  if (!list.length) return null;
  if (summon.owner === "me") {
    const ahead = list.filter((x) => x.pos >= summon.pos - 0.4).sort((a, b) => a.pos - b.pos);
    return ahead[0] || null;
  }
  const ahead = list.filter((x) => x.pos <= summon.pos + 0.4).sort((a, b) => b.pos - a.pos);
  return ahead[0] || null;
}

function getActorByOwner(owner) {
  return owner === "me" ? state.my : state.enemy;
}

function applySummonGoalEffect(s) {
  const enemySide = s.owner === "me" ? "enemy" : "my";
  const enemyActor = getActorByOwner(enemySide === "enemy" ? "enemy" : "me");
  const selfActor = getActorByOwner(s.owner);
  if (s.goalBehavior === "chip_once") {
    if (s.goalTriggered) return;
    s.goalTriggered = true;
    if (enemySide === "enemy") state.enemyHp = Math.max(0, state.enemyHp - s.chip);
    else state.myHp = Math.max(0, state.myHp - s.chip);
    triggerHitFx(enemySide, s.chip);
    logLine(`${s.name}突破防线，对${enemySide === "enemy" ? "敌方" : "我方"}造成 ${s.chip} 点伤害。`);
    s.hp = 0;
    return;
  }
  if (state.gameTime < s.nextGoalAt) return;
  s.nextGoalAt = state.gameTime + (s.goalCd || 1);

  if (s.goalBehavior === "siege") {
    const dmg = Math.max(1, Math.round(s.goalDamage || s.chip || 4));
    if (enemySide === "enemy") state.enemyHp = Math.max(0, state.enemyHp - dmg);
    else state.myHp = Math.max(0, state.myHp - dmg);
    triggerHitFx(enemySide, dmg);
    logLine(`${s.name}持续压制，对${enemySide === "enemy" ? "敌方" : "我方"}造成 ${dmg} 点伤害。`);
    return;
  }
  if (s.goalBehavior === "explode") {
    if (s.goalTriggered) return;
    s.goalTriggered = true;
    const dmg = Math.max(1, Math.round(s.explodeDamage || (s.chip * 2)));
    if (enemySide === "enemy") state.enemyHp = Math.max(0, state.enemyHp - dmg);
    else state.myHp = Math.max(0, state.myHp - dmg);
    triggerHitFx(enemySide, dmg);
    logLine(`${s.name}自爆，对${enemySide === "enemy" ? "敌方" : "我方"}造成 ${dmg} 点伤害。`);
    s.hp = 0;
    return;
  }
  if (s.goalBehavior === "steal_resource") {
    const richest = ELEMENTS
      .map((e) => ({ e, v: enemyActor.resources[e].current }))
      .sort((a, b) => b.v - a.v)[0];
    const amount = Math.min(s.stealAmount || 2, richest?.v || 0);
    if (richest && amount > 0) {
      enemyActor.resources[richest.e].current = Math.max(0, enemyActor.resources[richest.e].current - amount);
      selfActor.resources[richest.e].current = Math.min(selfActor.resources[richest.e].max, selfActor.resources[richest.e].current + amount);
      logLine(`${s.name}劫掠成功：转移${ELEMENT_NAME[richest.e]}资源 ${amount.toFixed(1)}。`);
    }
    return;
  }
  if (s.goalBehavior === "leech_hp") {
    const drain = Math.max(1, Math.round(s.drain || 4));
    const heal = Math.max(1, Math.round(s.heal || 3));
    if (enemySide === "enemy") state.enemyHp = Math.max(0, state.enemyHp - drain);
    else state.myHp = Math.max(0, state.myHp - drain);
    if (s.owner === "me") state.myHp = Math.min(100, state.myHp + heal);
    else state.enemyHp = Math.min(100, state.enemyHp + heal);
    triggerHitFx(enemySide, drain);
    logLine(`${s.name}吸血：对${enemySide === "enemy" ? "敌方" : "我方"}造成 ${drain} 点并回复 ${heal} 点生命。`);
  }
}

function processSummons(dt) {
  const damageMap = new Map();
  const engaged = new Set();

  state.field.summons.forEach((s) => {
    if (s.hp <= 0) return;
    const enemy = findFrontEnemySummon(s);
    if (!enemy) return;
    if (Math.abs(enemy.pos - s.pos) > SUMMON_BRAWL_RANGE) return;
    engaged.add(s.id);
    engaged.add(enemy.id);
    if (state.gameTime < s.nextHitAt) return;
    s.nextHitAt = state.gameTime + s.hitCd;
    s.lastHitAt = state.gameTime;
    damageMap.set(enemy.id, (damageMap.get(enemy.id) || 0) + s.atk);
    logLine(`${s.name}与${enemy.name}交战，造成 ${s.atk} 点伤害。`);
  });

  if (damageMap.size > 0) {
    state.field.summons.forEach((s) => {
      const dmg = damageMap.get(s.id) || 0;
      if (dmg <= 0) return;
      s.hp = Math.max(0, s.hp - dmg);
    });
  }

  state.field.summons = state.field.summons.filter((s) => s.hp > 0);

  state.field.summons.forEach((s) => {
    if (s.hp <= 0) return;
    if (engaged.has(s.id)) return;
    if (s.atGoal) {
      applySummonGoalEffect(s);
      return;
    }
    const target = findFrontStructureForSummon(s);
    const dir = s.owner === "me" ? 1 : -1;
    if (target && Math.abs(target.pos - s.pos) <= 5.2) {
      if (state.gameTime >= s.nextHitAt) {
        const before = target.ref.hp;
        target.ref.hp = Math.max(0, target.ref.hp - s.atk);
        s.nextHitAt = state.gameTime + s.hitCd;
        s.lastHitAt = state.gameTime;
        const label = target.kind === "wall" ? "壁垒" : target.kind === "gen" ? "资源塔" : "箭塔";
        logLine(`${s.name}攻击${label}：耐久 ${before} -> ${target.ref.hp}。`);
        if (target.ref.hp <= 0) {
          if (target.kind === "wall") state.field.walls = state.field.walls.filter((w) => w.id !== target.ref.id);
          else if (target.kind === "gen") state.field.generators = state.field.generators.filter((g) => g.id !== target.ref.id);
          else state.field.arrowTowers = state.field.arrowTowers.filter((t) => t.id !== target.ref.id);
          logLine(`${target.ref.owner === "me" ? "我方" : "敌方"}第${target.ref.lane + 1}线${label}被摧毁。`);
        }
      }
      return;
    }
    s.pos = Math.max(LANE_LEFT, Math.min(LANE_RIGHT, s.pos + dir * s.speed * dt));
    s.slot = posToSlot(s.pos);
    if (s.owner === "me" && s.pos >= LANE_RIGHT - 0.6) {
      s.atGoal = true;
      s.pos = LANE_RIGHT - 0.2;
      s.slot = posToSlot(s.pos);
      applySummonGoalEffect(s);
    } else if (s.owner === "enemy" && s.pos <= LANE_LEFT + 0.6) {
      s.atGoal = true;
      s.pos = LANE_LEFT + 0.2;
      s.slot = posToSlot(s.pos);
      applySummonGoalEffect(s);
    }
  });
  state.field.summons = state.field.summons.filter((s) => s.hp > 0);
}

function drawCards(side, count) {
  const actor = side === "my" ? state.my : state.enemy;
  let drew = false;
  for (let i = 0; i < count; i++) {
    if (actor.hand.length >= actor.maxHand) return;
    if (actor.deck.length === 0) {
      if (actor.discard.length === 0) return;
      actor.deck = actor.discard.splice(0, actor.discard.length);
      shuffle(actor.deck);
      if (side === "my") logLine("牌库耗尽，已将弃牌洗回。" );
    }
    actor.hand.push(actor.deck.pop());
    drew = true;
  }
  if (side === "my" && drew) renderCards();
}

function formatSummonGoalTag(s) {
  if (s.goalBehavior === "siege") return "持续攻";
  if (s.goalBehavior === "explode") return "自爆";
  if (s.goalBehavior === "steal_resource") return "掠资";
  if (s.goalBehavior === "leech_hp") return "吸血";
  return "突进";
}

function getCardIcon(card) {
  if (card.effect?.startsWith("summon_")) return "🐾";
  if (card.effect === "resource_card") return "💠";
  if (card.effect?.startsWith("gen_")) return "🏯";
  if (card.effect?.startsWith("tower_")) return "🏹";
  if (card.effect?.startsWith("lane_")) return "🧭";
  if (card.effect?.startsWith("spell_spread_")) return "✨";
  if (card.type === "control") return "🕸";
  if (card.type === "defense") return "🛡";
  if (card.type === "attack") return ELEMENT_ICON[card.element] || "✦";
  return "✦";
}

function getActionVisual(card) {
  if (card.element === "fire" && card.type === "attack") return { icon: "🔥", kind: "fireball" };
  if (card.element === "water" && card.type === "attack") return { icon: "💧", kind: "waterbolt" };
  if (card.element === "metal" && card.type === "attack") return { icon: "⚔", kind: "blade" };
  if (card.element === "earth" && card.type === "attack") return { icon: "🪨", kind: "rock" };
  if (card.element === "wood" && card.type === "attack") return { icon: "🌿", kind: "vine" };
  if (card.type === "control") return { icon: "🌀", kind: "control" };
  if (card.type === "defense") return { icon: "🛡", kind: "defense" };
  return { icon: ELEMENT_ICON[card.element] || "✦", kind: "orb" };
}

function getSummonAvatar(effect, element) {
  const map = {
    summon_scout: "🐺",
    summon_guard: "🗿",
    summon_rusher: "🦊",
    summon_tide: "🦦",
    summon_taunt: "🛡",
    summon_vine: "🐻",
    summon_jugger: "🐘",
    summon_bomber: "💣",
    summon_raider: "🦅",
    summon_blood: "🦇"
  };
  return map[effect] || ELEMENT_ICON[element] || "🐾";
}

function getSummonConfig(effect) {
  const map = {
    summon_scout: { hp: 13, atk: 4, speed: 7.2, hitCd: 0.75, chip: 5, goalBehavior: "chip_once" },
    summon_guard: { hp: 20, atk: 6, speed: 5.4, hitCd: 0.95, chip: 7, goalBehavior: "siege", goalDamage: 3, goalCd: 2.6 },
    summon_rusher: { hp: 10, atk: 4, speed: 9.1, hitCd: 0.7, chip: 6, goalBehavior: "explode", explodeDamage: 15 },
    summon_tide: { hp: 12, atk: 5, speed: 6.5, hitCd: 0.8, chip: 6, goalBehavior: "steal_resource", stealAmount: 1.6, goalCd: 2.8 },
    summon_taunt: { hp: 24, atk: 4, speed: 4.9, hitCd: 0.95, chip: 5, goalBehavior: "siege", goalDamage: 2, goalCd: 2.7 },
    summon_vine: { hp: 16, atk: 5, speed: 6.1, hitCd: 0.82, chip: 6, goalBehavior: "leech_hp", drain: 2, heal: 1, goalCd: 2.5 },
    summon_jugger: { hp: 28, atk: 8, speed: 4.4, hitCd: 1.05, chip: 8, goalBehavior: "siege", goalDamage: 4, goalCd: 2.9 },
    summon_bomber: { hp: 12, atk: 4, speed: 7.4, hitCd: 0.78, chip: 5, goalBehavior: "explode", explodeDamage: 18 },
    summon_raider: { hp: 14, atk: 4, speed: 6.7, hitCd: 0.82, chip: 5, goalBehavior: "steal_resource", stealAmount: 2.0, goalCd: 2.6 },
    summon_blood: { hp: 15, atk: 5, speed: 6.3, hitCd: 0.84, chip: 6, goalBehavior: "leech_hp", drain: 3, heal: 2, goalCd: 2.6 }
  };
  return map[effect] || map.summon_scout;
}

function evaluateComboOnCast(from, card) {
  const actor = from === "me" ? state.my : state.enemy;
  if (!actor.combo) actor.combo = { key: "", expiresAt: 0 };
  let active = false;
  if (card.comboConsumer && actor.combo.key === card.comboConsumer && state.gameTime <= actor.combo.expiresAt) {
    active = true;
    actor.combo = { key: "", expiresAt: 0 };
  }
  if (card.comboStarter) {
    actor.combo = { key: card.comboStarter, expiresAt: state.gameTime + 6 };
  }
  return active;
}

function logComboCast(from, card, active) {
  const owner = from === "me" ? "我方" : "敌方";
  if (active && card.comboLabel) {
    logLine(`${owner}触发连携【${card.comboLabel}】：${card.name}获得强化。`);
  } else if (card.comboStarter && card.comboLabel) {
    logLine(`${owner}布置连携【${card.comboLabel}】，6秒内可接续。`);
  }
}

function getLaneRef(lane) {
  if (!state.field.lanes || !state.field.lanes.length) state.field.lanes = createLaneState();
  const idx = Math.max(0, Math.min(LANE_COUNT - 1, lane));
  return state.field.lanes[idx];
}

function registerLaneElement(from, lane, element) {
  if (!ELEMENTS.includes(element)) return;
  const laneRef = getLaneRef(lane);
  const keyTrack = from === "me" ? "meTrack" : "enemyTrack";
  const keyBonus = from === "me" ? "meNextBonus" : "enemyNextBonus";
  state.sharedRecentElements.push(element);
  state.sharedRecentElements = state.sharedRecentElements.slice(-3);
  laneRef[keyTrack].push(element);
  laneRef[keyTrack] = laneRef[keyTrack].slice(-3);
  if (laneRef[keyTrack].length === 3 && laneRef[keyTrack].every((x) => x === element)) {
    laneRef[keyBonus] = { element, damageMul: 1.5 };
    laneRef[keyTrack] = [];
    logLine(`${from === "me" ? "我方" : "敌方"}在第${lane + 1}线完成${ELEMENT_NAME[element]}元素累计：下一张同元素伤害+50%。`);
  }
}

function consumeLaneBonusIfAny(from, lane, element) {
  const laneRef = getLaneRef(lane);
  const keyBonus = from === "me" ? "meNextBonus" : "enemyNextBonus";
  const bonus = laneRef[keyBonus];
  if (!bonus || bonus.element !== element) return 1;
  laneRef[keyBonus] = null;
  return bonus.damageMul || 1;
}

function getLaneAuraMultiplier(from, lane, element) {
  const laneRef = getLaneRef(lane);
  const aura = from === "me" ? laneRef.meAura : laneRef.enemyAura;
  if (!aura || !aura.element || aura.expiresAt < state.gameTime) return 1;
  return aura.element === element ? (aura.damageMul || 1) : 1;
}

function pickSpreadLanes(baseLane, count) {
  const lane = Math.max(0, Math.min(LANE_COUNT - 1, baseLane));
  if (count >= 3) return [0, 1, 2];
  if (count <= 1) return [lane];
  if (lane === 0) return [0, 1];
  if (lane === 2) return [1, 2];
  return state.gameTime % 2 < 1 ? [0, 1] : [1, 2];
}

function scheduleAttackWithSpread(from, card, target, comboActive) {
  const actor = from === "me" ? state.my : state.enemy;
  const spread = Math.max(1, Math.floor(actor.nextAttackSpread || 1));
  const lanes = pickSpreadLanes(Number.isInteger(target?.lane) ? target.lane : 1, spread);
  actor.nextAttackSpread = 1;
  if (spread > 1) {
    logLine(`${from === "me" ? "我方" : "敌方"}辅助生效：下个伤害法术改为${spread}路线齐发。`);
  }
  lanes.forEach((lane) => {
    scheduleAction(from, card, { ...target, lane }, comboActive);
  });
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function envSpeedBonus(cardElement) {
  let bonus = 0;
  if (state.env.main.type === cardElement) bonus += 0.25 * state.env.main.power;
  if (state.env.sub.type === cardElement) bonus += 0.15 * state.env.sub.power;
  return bonus;
}

function roleDelayBonus(cardElement) {
  if (!state.role) return 0;
  if (state.role.main === "fire" && cardElement === "fire") return 0.2;
  return 0;
}

function getCostAfterRole(card) {
  const cost = { ...card.cost };
  if (state.role?.id === "tide" && card.element === "water") {
    cost.water = Math.max(1, (cost.water || 0) - 1);
  }
  return cost;
}

function canPay(actor, cost) {
  return Object.entries(cost).every(([k, v]) => actor.resources[k].current >= v);
}

function payCost(actor, cost) {
  Object.entries(cost).forEach(([k, v]) => {
    actor.resources[k].current = Math.max(0, actor.resources[k].current - v);
  });
}

function refundFromCost(cost, ratio = 0.55) {
  const out = {};
  Object.entries(cost || {}).forEach(([k, v]) => {
    const gain = Number(v || 0) * ratio;
    if (gain > 0) out[k] = gain;
  });
  return out;
}

function applyResourceGain(actor, gainMap) {
  let total = 0;
  Object.entries(gainMap || {}).forEach(([k, v]) => {
    if (!actor.resources[k]) return;
    const before = actor.resources[k].current;
    actor.resources[k].current = Math.min(actor.resources[k].max, before + v);
    total += Math.max(0, actor.resources[k].current - before);
  });
  return total;
}

function scheduleAction(from, card) {
  const target = arguments[2] || { type: "lane", lane: 1, pos: from === "me" ? 85 : 15 };
  const comboActive = Boolean(arguments[3]);
  const speedBonus = envSpeedBonus(card.element) + (from === "me" ? roleDelayBonus(card.element) : 0);
  const baseTravel = Math.max(0.7, card.baseDelay - speedBonus);
  const interceptBonus = 0;
  const eventTravelBonus = state.battlefieldEvent.id === "gale" ? -0.25 : 0;
  const comboTravelCut = comboActive ? (card.comboTravelCut || 0) : 0;
  const travelTime = Math.max(1.4, baseTravel + 2.2 + interceptBonus + eventTravelBonus - comboTravelCut);
  const dueAt = state.gameTime + travelTime;
  const lane = Number.isInteger(target.lane) ? target.lane : Math.floor(Math.random() * LANE_COUNT);
  const comboPowerBonus = comboActive ? (card.comboPowerBonus || 0) : 0;
  const comboEffectValueBonus = comboActive ? (card.comboEffectValueBonus || 0) : 0;
  const laneAccumMul = card.type === "attack" ? consumeLaneBonusIfAny(from, lane, card.element) : 1;
  const laneAuraMul = card.type === "attack" ? getLaneAuraMultiplier(from, lane, card.element) : 1;
  const finalPower = Math.round(((card.power || 0) + comboPowerBonus) * laneAccumMul * laneAuraMul);
  const visual = getActionVisual(card);

  state.queue.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    from,
    name: card.name,
    element: card.element,
    type: card.type,
    power: finalPower,
    effect: card.effect,
    effectValue: (card.effectValue || 0) + comboEffectValueBonus,
    comboActive,
    comboLabel: comboActive ? (card.comboLabel || "") : "",
    visualIcon: visual.icon,
    visualKind: visual.kind,
    laneAccumMul,
    laneAuraMul,
    lane,
    targetType: "hero",
    targetId: target.id,
    targetPos: typeof target.pos === "number" ? target.pos : (from === "me" ? 85 : 15),
    trapTriggers: [],
    launchedAt: state.gameTime,
    dueAt
  });
  actionAttachTrapTriggers(state.queue[state.queue.length - 1], travelTime);
  state.queue.sort((a, b) => a.dueAt - b.dueAt);
  logLine(`${from === "me" ? "我方" : "敌方"}在 ${lane + 1} 号线打出【${card.name}】，飞行 ${travelTime.toFixed(1)} 秒。`);
  if (card.type === "attack" && laneAccumMul > 1) logLine(`第${lane + 1}线元素累计触发：${card.name}伤害提升至 ${finalPower}。`);
  if (card.type === "attack" && laneAuraMul > 1) logLine(`第${lane + 1}线通道调谐生效：${card.name}获得 ${(laneAuraMul * 100 - 100).toFixed(0)}% 增伤。`);
}

function actionAttachTrapTriggers(action, travelTime) {
  const trapOwner = action.from === "me" ? "enemy" : "me";
  const traps = state.field.traps.filter((t) => t.owner === trapOwner && t.lane === action.lane && t.charges > 0);
  action.trapTriggers = traps.map((trap) => {
    const fraction = action.from === "me" ? trap.pos / 100 : (100 - trap.pos) / 100;
    const triggerAt = action.launchedAt + Math.max(0.2, travelTime * Math.max(0.1, Math.min(0.95, fraction)));
    return { trapId: trap.id, triggerAt, fired: false };
  });
}

function rotateBattlefieldEvent() {
  state.eventIndex = (state.eventIndex + 1) % EVENT_ROTATION.length;
  state.battlefieldEvent = EVENT_ROTATION[state.eventIndex];
  logLine(`战场事件切换：${state.battlefieldEvent.name}（${state.battlefieldEvent.desc}）`);
}

function applyUtilityFallback(caster, card) {
  const actor = caster === "me" ? state.my : state.enemy;
  const owner = caster === "me" ? "我方" : "敌方";
  // Guaranteed baseline value: small resource return + draw acceleration.
  const base = caster === "me" ? 0.6 : 0.4;
  const roleExtra = state.role?.id === "tide" && caster === "me" ? 0.25 : 0;
  actor.resources[card.element].current = Math.min(actor.resources[card.element].max, actor.resources[card.element].current + base + roleExtra);
  if (caster === "me") {
    state.myCastLockUntil = Math.max(state.gameTime, state.myCastLockUntil - 0.18);
  } else {
    state.enemyCastLockUntil = Math.max(state.gameTime, state.enemyCastLockUntil - 0.12);
  }
  if (caster === "me") drawCards("my", 1);
  if (caster === "enemy") drawCards("enemy", 1);
  if (caster === "me") {
    pushDecision({
      title: `${card.name} 保底收益`,
      resource: base + roleExtra,
      cd: 0.18,
      note: "无有效目标时转化为资源与节奏"
    });
  }
  logLine(`${owner}【${card.name}】触发保底收益：回${ELEMENT_NAME[card.element]}资源并获得过牌节奏。`);
}

function resolveUtilityCardInstant(caster, card, target, comboActive = false) {
  if (card.type !== "utility") return false;
  if (card.effect === "resource_card") {
    const actor = caster === "me" ? state.my : state.enemy;
    const owner = caster === "me" ? "我方" : "敌方";
    const gain = Math.max(0.8, Number(card.effectValue) || 3);
    const pool = actor.resources[card.element];
    const before = pool.current;
    pool.current = Math.min(pool.max, pool.current + gain);
    if (caster === "me") {
      pushDecision({
        title: `${card.name} 采气`,
        resource: pool.current - before,
        note: `${ELEMENT_NAME[card.element]}资源快速补给`
      });
    }
    logLine(`${owner}使用【${card.name}】：${ELEMENT_NAME[card.element]}资源 +${(pool.current - before).toFixed(1)}。`);
    return true;
  }
  return placeLaneEntity(caster, card, target, comboActive);
}

function placeLaneEntity(caster, card, target, comboActive = false) {
  if (card.effect === "spell_spread_2" || card.effect === "spell_spread_3") {
    const actor = caster === "me" ? state.my : state.enemy;
    actor.nextAttackSpread = card.effect === "spell_spread_3" ? 3 : 2;
    if (caster === "me") pushDecision({ title: `${card.name} 辅助`, cd: 0.15, note: `下一个伤害法术改为${actor.nextAttackSpread}路线齐发` });
    logLine(`${caster === "me" ? "我方" : "敌方"}施放【${card.name}】：下个伤害法术将覆盖${actor.nextAttackSpread}条通道。`);
    return true;
  }

  if (target.type !== "lane" || !Number.isInteger(target.lane)) {
    if (caster === "me") logLine("请将建筑/陷阱/召唤卡拖拽到某一条战线地块。");
    return false;
  }
  const owner = caster === "me" ? "我方" : "敌方";
  const lane = Math.max(0, Math.min(LANE_COUNT - 1, target.lane));
  const isSummonCard = card.effect?.startsWith("summon_");
  const sideSlotDefault = isSummonCard
    ? (caster === "me" ? 0 : LANE_TILE_COUNT - 1)
    : (caster === "me" ? 2 : 5);
  const rawSlot = isSummonCard
    ? sideSlotDefault
    : Number.isInteger(target.slot)
      ? target.slot
      : posToSlot(typeof target.pos === "number" ? target.pos : slotToPos(sideSlotDefault));
  let slot = Math.max(caster === "me" ? 0 : Math.floor(LANE_TILE_COUNT / 2), Math.min(caster === "me" ? Math.floor(LANE_TILE_COUNT / 2) - 1 : LANE_TILE_COUNT - 1, rawSlot));
  const ownTowerSlot = caster === "me" ? 0 : LANE_TILE_COUNT - 1;
  if (!isSummonCard && slot === ownTowerSlot) {
    slot = caster === "me" ? 1 : LANE_TILE_COUNT - 2;
  }
  const pos = slotToPos(slot);

  if (card.effect === "wall") {
    const existed = state.field.walls.find((w) => w.owner === caster && w.lane === lane);
    if (existed) {
      existed.hp = Math.min(40, existed.hp + 14);
      existed.pos = pos;
      existed.slot = slot;
      if (caster === "me") pushDecision({ title: `${card.name} 加固`, prevent: 7, note: `第${lane + 1}线墙体耐久提升` });
      logLine(`${owner}在 ${lane + 1} 号线加固壁垒。`);
      return true;
    }
    state.field.walls.push({
      id: `wall-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      owner: caster,
      lane,
      slot,
      pos,
      hp: 22
    });
    if (caster === "me") pushDecision({ title: `${card.name} 建立`, prevent: 10, note: `第${lane + 1}线建立防线` });
    logLine(`${owner}在 ${lane + 1} 号线建立坚土壁垒。`);
    return true;
  }

  if (card.effect === "trap_freeze" || card.effect === "trap_snare") {
    state.field.traps.push({
      id: `trap-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      owner: caster,
      lane,
      slot,
      pos,
      effect: card.effect,
      charges: card.effect === "trap_freeze" ? 2 : 1,
      radius: card.effect === "trap_freeze" ? 12 : 16
    });
    if (caster === "me") pushDecision({ title: `${card.name} 布置`, prevent: card.effect === "trap_freeze" ? 6 : 8, note: `第${lane + 1}线陷阱待触发` });
    logLine(`${owner}在 ${lane + 1} 号线布置${card.name}。`);
    return true;
  }

  if (card.effect?.startsWith("gen_")) {
    const actor = caster === "me" ? state.my : state.enemy;
    const gain = 3.2;
    const pool = actor.resources[card.element];
    const before = pool.current;
    pool.current = Math.min(pool.max, pool.current + gain);
    if (caster === "me") pushDecision({ title: `${card.name} 采气`, resource: pool.current - before, note: `${ELEMENT_NAME[card.element]}资源快速补给` });
    logLine(`${owner}使用【${card.name}】：${ELEMENT_NAME[card.element]}资源 +${(pool.current - before).toFixed(1)}。`);
    return true;
  }

  if (card.effect === "lane_attune_fire" || card.effect === "lane_attune_water") {
    const laneRef = getLaneRef(lane);
    const auraKey = caster === "me" ? "meAura" : "enemyAura";
    const element = card.effect.endsWith("fire") ? "fire" : "water";
    laneRef[auraKey] = { element, expiresAt: state.gameTime + 10, damageMul: 1.3 };
    if (caster === "me") pushDecision({ title: `${card.name} 调谐`, resource: 1.2, note: `第${lane + 1}线${ELEMENT_NAME[element]}系10秒增伤` });
    logLine(`${owner}改写第${lane + 1}线属性：${ELEMENT_NAME[element]}脉调谐（10秒）。`);
    return true;
  }

  if (card.effect === "lane_scramble") {
    const laneRef = getLaneRef(lane);
    const enemyTrackKey = caster === "me" ? "enemyTrack" : "meTrack";
    const enemyBonusKey = caster === "me" ? "enemyNextBonus" : "meNextBonus";
    const enemyAuraKey = caster === "me" ? "enemyAura" : "meAura";
    laneRef[enemyTrackKey] = [];
    laneRef[enemyBonusKey] = null;
    laneRef[enemyAuraKey] = { element: "", expiresAt: 0, damageMul: 1 };
    if (caster === "me") pushDecision({ title: `${card.name} 扰流`, prevent: 4, note: `第${lane + 1}线敌方元素累计被清空` });
    logLine(`${owner}在第${lane + 1}线发动扰流：敌方累计与调谐已被清除。`);
    return true;
  }

  if (card.effect?.startsWith("tower_")) {
    const tower = state.field.arrowTowers.find((t) => t.owner === caster && t.lane === lane && t.hp > 0);
    if (!tower) {
      if (caster === "me") logLine(`第${lane + 1}线没有可强化的己方箭塔。`);
      return false;
    }
    if (card.effect === "tower_fortify") {
      tower.maxHp = Math.min(42, tower.maxHp + 7);
      tower.hp = Math.min(tower.maxHp, tower.hp + 9);
      if (caster === "me") pushDecision({ title: `${card.name} 加固`, prevent: 6, note: `第${lane + 1}线箭塔耐久提升` });
      logLine(`${owner}强化第${lane + 1}线箭塔：耐久 ${Math.round(tower.hp)}/${Math.round(tower.maxHp)}。`);
      return true;
    }
    if (card.effect === "tower_focus") {
      tower.atk = Math.min(7.5, tower.atk + 1.2);
      tower.range = Math.min(43, tower.range + 3);
      if (caster === "me") pushDecision({ title: `${card.name} 强化`, damage: 4, note: `第${lane + 1}线箭塔攻击与射程提升` });
      logLine(`${owner}强化第${lane + 1}线箭塔：攻击 ${tower.atk.toFixed(1)}，射程 ${tower.range.toFixed(0)}。`);
      return true;
    }
    if (card.effect === "tower_volley") {
      tower.hitCd = Math.max(0.45, tower.hitCd - 0.2);
      tower.range = Math.min(45, tower.range + 2);
      if (caster === "me") pushDecision({ title: `${card.name} 机括`, damage: 3, note: `第${lane + 1}线箭塔攻速提升` });
      logLine(`${owner}强化第${lane + 1}线箭塔：攻速提升（间隔 ${tower.hitCd.toFixed(2)}s）。`);
      return true;
    }
  }

  if (card.effect?.startsWith("summon_")) {
    const cfg = getSummonConfig(card.effect);
    const hpBonus = comboActive ? (card.comboSummonHpBonus || 0) : 0;
    const atkBonus = comboActive ? (card.comboSummonAtkBonus || 0) : 0;
    state.field.summons.push({
      id: `sum-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      owner: caster,
      lane,
      slot,
      pos,
      name: card.name,
      summonKind: card.effect,
      element: card.element,
      maxHp: cfg.hp + hpBonus,
      hp: cfg.hp + hpBonus,
      atk: cfg.atk + atkBonus,
      speed: cfg.speed,
      hitCd: cfg.hitCd,
      chip: cfg.chip,
      goalBehavior: cfg.goalBehavior || "chip_once",
      goalDamage: cfg.goalDamage || cfg.chip || 4,
      goalCd: cfg.goalCd || 1,
      explodeDamage: cfg.explodeDamage || 0,
      stealAmount: cfg.stealAmount || 0,
      drain: cfg.drain || 0,
      heal: cfg.heal || 0,
      atGoal: false,
      goalTriggered: false,
      nextGoalAt: state.gameTime + 0.3,
      nextHitAt: state.gameTime + 0.25,
      bornAt: state.gameTime,
      lastHitAt: -999
    });
    if (caster === "me") {
      pushDecision({ title: `${card.name} 召唤`, prevent: cfg.hp * 0.2, note: `第${lane + 1}线召唤体入场` });
    }
    logLine(`${owner}在 ${lane + 1} 号线召唤【${card.name}】。`);
    return true;
  }
  return false;
}

function discardCardFromHand(index) {
  if (!state.running) {
    logLine("战斗未开始或已暂停。");
    return;
  }
  if (isOnlineMode() && net.role === "guest") {
    logLine("联机访客暂不支持本地弃卡。");
    return;
  }
  if (state.pendingCast) return;
  if (state.gameTime < state.myDiscardLockUntil) {
    logLine(`弃卡冷却中，还需 ${(state.myDiscardLockUntil - state.gameTime).toFixed(1)} 秒。`);
    return;
  }
  const card = state.my.hand[index];
  if (!card) return;
  const cost = getCostAfterRole(card);
  const gain = refundFromCost(cost, 0.55);
  const removed = state.my.hand.splice(index, 1)[0];
  state.my.discard.push(removed);
  const gained = applyResourceGain(state.my, gain);
  state.myDiscardLockUntil = state.gameTime + 0.28;
  pushDecision({
    title: `${removed.name} 弃卡`,
    resource: gained,
    note: "弃卡回收部分资源"
  });
  logLine(`我方弃掉【${removed.name}】，回收资源 ${gained.toFixed(1)}。`);
  clearArmedCard();
  renderCards();
  renderRuntime();
}

function enemyDiscardForResource(aiProfile = getAiProfile()) {
  if (!state.enemy.hand.length) return false;
  const pick = state.enemy.hand
    .map((card, idx) => {
      const totalCost = Object.values(card.cost || {}).reduce((sum, v) => sum + Number(v || 0), 0);
      return { card, idx, totalCost };
    })
    .sort((a, b) => b.totalCost - a.totalCost)[0];
  if (!pick) return false;
  const gain = refundFromCost(pick.card.cost, aiProfile.discardRefund || 0.5);
  const removed = state.enemy.hand.splice(pick.idx, 1)[0];
  state.enemy.discard.push(removed);
  const gained = applyResourceGain(state.enemy, gain);
  logLine(`敌方弃掉【${removed.name}】，回收资源 ${gained.toFixed(1)}。`);
  return true;
}

function playCardFromHand(index, triggerBtn, target = { type: "lane", lane: 1, pos: 80 }) {
  if (!state.running) {
    logLine("战斗未开始或已暂停。");
    return;
  }
  if (isOnlineMode() && net.role === "guest") {
    netSend("play", { index, target });
    logLine("已发送出牌指令，等待房主结算。");
    return;
  }
  if (state.pendingCast) return;
  if (state.gameTime < state.myDiscardLockUntil) {
    logLine(`弃卡后硬直中，还需 ${(state.myDiscardLockUntil - state.gameTime).toFixed(1)} 秒。`);
    return;
  }
  if (state.gameTime < state.myCastLockUntil) {
    logLine(`出牌冷却中，还需 ${(state.myCastLockUntil - state.gameTime).toFixed(1)} 秒。`);
    return;
  }
  const card = state.my.hand[index];
  if (!card) return;

  const cost = getCostAfterRole(card);
  if (!canPay(state.my, cost)) {
    logLine(`资源不足，无法使用【${card.name}】。`);
    return;
  }
  if (state.armedCardIndex === index) clearArmedCard();
  state.pendingCast = true;
  const cardNode = triggerBtn?.closest(".card");
  if (triggerBtn) triggerBtn.classList.add("cast-flash");
  if (cardNode) cardNode.classList.add("cast-pop");

  setTimeout(() => {
    const liveIndex = state.my.hand.indexOf(card);
    if (liveIndex === -1) {
      state.pendingCast = false;
      renderRuntime();
      return;
    }
    payCost(state.my, cost);
    const used = state.my.hand.splice(liveIndex, 1)[0];
    recordPlayerPattern(used);
    state.my.discard.push(used);
    const comboActive = evaluateComboOnCast("me", used);
    logComboCast("me", used, comboActive);
    if (used.effect !== "resource_card" && target?.type === "lane") {
      registerLaneElement("me", target.lane ?? 1, used.element);
    }
    state.castFxUntil = state.gameTime + 0.25;
    state.myCastLockUntil = state.gameTime + 0.9;
    if (!resolveUtilityCardInstant("me", used, target, comboActive)) {
      if (used.type === "attack") scheduleAttackWithSpread("me", used, target, comboActive);
      else scheduleAction("me", used, target, comboActive);
    }
    state.pendingCast = false;
    renderCards();
    renderRuntime();
  }, 120);
}

function playEnemyCardByIndex(index, target = { type: "lane", lane: 1, pos: 20 }) {
  if (!state.running) return false;
  if (state.gameTime < state.enemyCastLockUntil) return false;
  const card = state.enemy.hand[index];
  if (!card) return false;
  if (!canPay(state.enemy, card.cost)) return false;
  payCost(state.enemy, card.cost);
  const used = state.enemy.hand.splice(index, 1)[0];
  state.enemy.discard.push(used);
  const comboActive = evaluateComboOnCast("enemy", used);
  logComboCast("enemy", used, comboActive);
  if (used.effect !== "resource_card" && target?.type === "lane") {
    registerLaneElement("enemy", target.lane ?? 1, used.element);
  }
  if (!resolveUtilityCardInstant("enemy", used, target, comboActive)) {
    if (used.type === "attack") scheduleAttackWithSpread("enemy", used, target, comboActive);
    else scheduleAction("enemy", used, target, comboActive);
  }
  state.enemyCastLockUntil = state.gameTime + 1.05;
  return true;
}

function consumeDraggedCard(target, dragEvent = null) {
  let idx = state.dragCardIndex;
  if ((idx === null || idx === undefined) && dragEvent?.dataTransfer) {
    const raw = dragEvent.dataTransfer.getData("text/plain");
    if (raw !== "") idx = Number(raw);
  }
  state.dragCardIndex = null;
  if (idx === state.armedCardIndex) clearArmedCard();
  clearDragPreview();
  if (idx === null || idx === undefined || Number.isNaN(idx)) return;
  playCardFromHand(Number(idx), null, target);
}

function ensureDragPreviewEls() {
  if (!el.dragLine) {
    const line = document.createElement("div");
    line.className = "drag-aim-line";
    line.style.display = "none";
    document.body.appendChild(line);
    el.dragLine = line;
  }
  if (!el.dragDot) {
    const dot = document.createElement("div");
    dot.className = "drag-aim-dot";
    dot.style.display = "none";
    document.body.appendChild(dot);
    el.dragDot = dot;
  }
}

function updateDragPreview(toX, toY, target = "") {
  if (!state.dragPreview.active) return;
  state.dragPreview.toX = toX;
  state.dragPreview.toY = toY;
  state.dragPreview.target = target || "";
  state.dragPreview.magnetTargetId = target === "projectile" ? pickNearestEnemyProjectileIdByClientX(toX) : null;
  ensureDragPreviewEls();

  const dx = toX - state.dragPreview.fromX;
  const dy = toY - state.dragPreview.fromY;
  const len = Math.max(4, Math.sqrt(dx * dx + dy * dy));
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;

  el.dragLine.style.display = "block";
  el.dragLine.style.left = `${state.dragPreview.fromX}px`;
  el.dragLine.style.top = `${state.dragPreview.fromY}px`;
  el.dragLine.style.width = `${len}px`;
  el.dragLine.style.transform = `rotate(${angle}deg)`;
  el.dragLine.classList.toggle("target-hero", target === "hero");
  el.dragLine.classList.toggle("target-projectile", target === "projectile");

  el.dragDot.style.display = "block";
  el.dragDot.style.left = `${toX}px`;
  el.dragDot.style.top = `${toY}px`;
  el.dragDot.classList.toggle("target-hero", target === "hero");
  el.dragDot.classList.toggle("target-projectile", target === "projectile");
}

function clearDragPreview() {
  state.dragPreview.active = false;
  state.dragPreview.target = "";
  state.dragPreview.magnetTargetId = null;
  if (el.dragLine) el.dragLine.style.display = "none";
  if (el.dragDot) el.dragDot.style.display = "none";
}

function getDropTargetAtPoint(clientX, clientY) {
  const hit = document.elementFromPoint(clientX, clientY);
  if (!hit) return null;
  const slotEl = hit.closest(".drop-slot");
  if (slotEl) {
    return {
      type: "lane",
      lane: Number(slotEl.dataset.lane),
      slot: Number(slotEl.dataset.slot),
      pos: slotToPos(Number(slotEl.dataset.slot))
    };
  }
  const laneEl = hit.closest(".drop-lane");
  if (laneEl) {
    const rect = laneEl.getBoundingClientRect();
    const topPct = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
    const pos = 100 - topPct;
    const slot = posToSlot(pos);
    const lane = Number(laneEl.dataset.lane);
    return { type: "lane", lane, slot, pos: slotToPos(slot) };
  }
  return null;
}

function getLaneTargetFromEvent(ev) {
  const hit = ev.target;
  if (!hit) return null;
  const slotEl = hit.closest(".drop-slot");
  if (slotEl) {
    const lane = Number(slotEl.dataset.lane);
    const slot = Number(slotEl.dataset.slot);
    return { type: "lane", lane, slot, pos: slotToPos(slot) };
  }
  const laneEl = hit.closest(".drop-lane");
  if (laneEl) {
    const rect = laneEl.getBoundingClientRect();
    const topPct = Math.max(0, Math.min(100, ((ev.clientY - rect.top) / rect.height) * 100));
    const pos = 100 - topPct;
    const slot = posToSlot(pos);
    const lane = Number(laneEl.dataset.lane);
    return { type: "lane", lane, slot, pos: slotToPos(slot) };
  }
  return null;
}

function tryCastArmedTarget(target) {
  if (!isBattleActive()) return;
  const idx = state.armedCardIndex;
  if (idx === null || idx === undefined) return;
  if (!state.my.hand[idx]) {
    clearArmedCard();
    return;
  }
  playCardFromHand(idx, null, target);
}

function markDropHover(target) {
  clearDropHighlights();
  if (!target) return;
  if (target.type === "lane") {
    if (Number.isInteger(target.slot)) {
      const slotEl = el.timeline.querySelector(`.drop-slot[data-lane="${target.lane}"][data-slot="${target.slot}"]`);
      if (slotEl) slotEl.classList.add("drop-active");
      return;
    }
    const laneEl = el.timeline.querySelector(`.drop-lane[data-lane="${target.lane}"]`);
    if (laneEl) laneEl.classList.add("drop-active");
  }
}

function beginPointerDrag(index, cardEl, ev) {
  if (cardEl.classList.contains("drag-disabled")) return;
  state.dragCardIndex = index;
  state.pointerDragging = true;
  state.dragStarted = false;
  state.dragStartX = ev.clientX;
  state.dragStartY = ev.clientY;
  state.dragPreview.active = false;
  state.dragPreview.fromX = 0;
  state.dragPreview.fromY = 0;
  document.body.classList.add("dragging-mode");
  ev.preventDefault();
}

function movePointerDrag(ev) {
  if (state.dragCardIndex === null || !state.pointerDragging) return;
  if (!state.dragStarted) {
    const dx = ev.clientX - state.dragStartX;
    const dy = ev.clientY - state.dragStartY;
    if (Math.hypot(dx, dy) < 6) return;
    state.dragStarted = true;
    const cardEl = el.hand?.querySelector(`.card[data-idx="${state.dragCardIndex}"]`);
    if (cardEl) cardEl.classList.add("dragging-card");
    if (cardEl) {
      const rect = cardEl.getBoundingClientRect();
      state.dragPreview.active = true;
      state.dragPreview.fromX = rect.left + rect.width / 2;
      state.dragPreview.fromY = rect.top + rect.height / 2;
    }
  }
  const target = getDropTargetAtPoint(ev.clientX, ev.clientY);
  markDropHover(target);
  if (target?.type === "lane") {
    state.dragPreview.magnetTargetId = null;
    updateDragPreview(ev.clientX, ev.clientY, "projectile");
  } else {
    state.dragPreview.magnetTargetId = null;
    updateDragPreview(ev.clientX, ev.clientY, "");
  }
  ev.preventDefault();
}

function endPointerDrag(ev) {
  if (state.dragCardIndex === null || !state.pointerDragging) return;
  if (state.dragStarted) {
    const target = getDropTargetAtPoint(ev.clientX, ev.clientY);
    if (target) {
      consumeDraggedCard(target, null);
    } else {
      state.dragCardIndex = null;
      clearDragPreview();
    }
    state.suppressCardClick = true;
    setTimeout(() => {
      state.suppressCardClick = false;
    }, 0);
  } else {
    state.dragCardIndex = null;
    clearDragPreview();
  }
  state.pointerDragging = false;
  state.dragStarted = false;
  document.body.classList.remove("dragging-mode");
  clearDropHighlights();
}

function enemyPlayLogic() {
  const ai = getAiProfile();
  if (state.gameTime < state.enemyCastLockUntil) return;
  const playable = state.enemy.hand
    .map((card, idx) => ({ card, idx, cost: getCostAfterRole(card) }))
    .filter(({ cost }) => canPay(state.enemy, cost));
  if (!playable.length) {
    enemyDiscardForResource(ai);
    return;
  }

  const threat = pickHighestThreatProjectile("me");
  const needUrgentIntercept = threat && (threat.dueAt - state.gameTime) <= ai.urgencyIntercept;
  const comboReadyKey = state.enemy.combo?.expiresAt > state.gameTime ? state.enemy.combo.key : "";
  const pattern = getPlayerPatternWeights();
  const hpLead = state.enemyHp - state.myHp;
  const aggression = Math.max(0.35, Math.min(1.35, 0.75 + hpLead / 90 + (state.myHp <= 30 ? 0.25 : 0) - (state.enemyHp <= 30 ? 0.2 : 0)));
  const defenseBias = Math.max(0.55, Math.min(1.7, 1.15 - aggression + (needUrgentIntercept ? 0.35 : 0) + (ai.defenseBiasAdd || 0)));

  function lanePressureToEnemy(lane) {
    const myQueue = state.queue.filter((x) => x.from === "me" && x.lane === lane);
    const mySoon = myQueue.filter((x) => x.dueAt - state.gameTime <= 2.3).length;
    const myAtkSoon = myQueue.filter((x) => x.type === "attack" && x.dueAt - state.gameTime <= 2.8).length;
    const mySummons = state.field.summons.filter((x) => x.owner === "me" && x.lane === lane).length;
    const enemySummons = state.field.summons.filter((x) => x.owner === "enemy" && x.lane === lane).length;
    const myTower = state.field.arrowTowers.find((x) => x.owner === "me" && x.lane === lane && x.hp > 0);
    const enemyTower = state.field.arrowTowers.find((x) => x.owner === "enemy" && x.lane === lane && x.hp > 0);
    const myWalls = state.field.walls.filter((x) => x.owner === "me" && x.lane === lane);
    const frontlineHp = myWalls.reduce((sum, x) => sum + x.hp, 0) + (myTower ? myTower.hp * 1.1 : 0) + mySummons * 3.5;
    const retaliation = (enemyTower ? enemyTower.hp * 0.08 : 0) + enemySummons * 2.8;
    return { mySoon, myAtkSoon, frontlineHp, retaliation };
  }

  function estimateFollowupPlayableCount(useIdx, useCost) {
    const rem = {};
    ELEMENTS.forEach((e) => {
      rem[e] = Math.max(0, state.enemy.resources[e].current - (useCost[e] || 0));
    });
    return state.enemy.hand
      .map((card, idx) => ({ card, idx, cost: getCostAfterRole(card) }))
      .filter(({ idx }) => idx !== useIdx)
      .filter(({ cost }) => Object.entries(cost).every(([k, v]) => rem[k] >= v))
      .length;
  }

  function laneCounts(owner, lane) {
    return {
      q: state.queue.filter((x) => x.from === owner && x.lane === lane).length,
      sum: state.field.summons.filter((x) => x.owner === owner && x.lane === lane).length,
      gen: 0,
      trap: state.field.traps.filter((x) => x.owner === owner && x.lane === lane).length,
      tower: state.field.arrowTowers.filter((x) => x.owner === owner && x.lane === lane && x.hp > 0).length
    };
  }

  function scorePlay(card, lane, idx, cost) {
    const laneRef = getLaneRef(lane);
    const meLane = laneCounts("me", lane);
    const enemyLane = laneCounts("enemy", lane);
    const laneP = lanePressureToEnemy(lane);
    const mePressure = meLane.q * 1.7 + meLane.sum * 2.2 + meLane.gen * 1.1 + meLane.tower * 1.3;
    const enemyHold = enemyLane.q * 1.2 + enemyLane.sum * 1.7 + enemyLane.trap * 0.8 + enemyLane.tower * 1.1;
    const comboReady = !!(card.comboConsumer && comboReadyKey === card.comboConsumer);
    const lowHp = state.enemyHp <= 34;
    const killWindow = state.myHp <= 30;
    const costTotal = Object.values(cost || {}).reduce((sum, v) => sum + Number(v || 0), 0);
    const followup = estimateFollowupPlayableCount(idx, cost);
    let score = 0;

    if (card.type === "attack") {
      score += 10 + (card.power || 5) * 0.7;
      score += mePressure * 1.2;
      score += aggression * 4.2;
      score += laneP.frontlineHp > 0 ? (9.5 / Math.max(4, laneP.frontlineHp)) : 2.2;
      if (state.myHp <= Math.max(6, (card.power || 0) + 3)) score += 14;
      if (threat && canIntercept(card)) score += 3 + interceptFitScore(card, threat) * 0.55;
      if (state.enemy.nextAttackSpread > 1) score += 6;
      if (comboReady) score += 8;
      if (laneRef.enemyNextBonus?.element === card.element) score += 5;
      if (laneRef.enemyAura?.element === card.element && laneRef.enemyAura.expiresAt > state.gameTime) score += 4;
      if (killWindow) score += 4;
      if (lowHp) score -= 1.5;
      score += pattern.generator * 3.6;
      score += pattern.support * 1.4;
    } else if (card.type === "control" || card.type === "defense") {
      score += threat ? 12 : 4;
      if (threat) score += interceptFitScore(card, threat) * 0.85;
      score += mePressure * 0.6;
      score += defenseBias * (laneP.myAtkSoon * 2.6 + laneP.mySoon * 1.2);
      if (lowHp) score += 2.5;
      if (comboReady) score += 6;
      score += pattern.attack * 3.2;
      score += pattern.summon * 2.4;
    } else if (card.type === "utility") {
      if (card.effect === "resource_card" || card.effect?.startsWith("gen_")) {
        const resNow = state.enemy.resources[card.element].current;
        score += resNow < 2.6 ? 10 : 2.2;
        score += followup <= 1 ? 3.2 : 0;
        if (lowHp) score += 1.2;
        score -= pattern.attack * 1.4;
      } else if (card.effect?.startsWith("summon_")) {
        score += 8 + mePressure * 0.4;
        if (enemyHold > 4) score -= 1.2;
        score += Math.max(0, (8 - laneP.frontlineHp) * 0.45);
        if (lowHp) score += 2;
        if (comboReady) score += 7;
        score += pattern.control * 1.1;
        score -= pattern.summon * 1.2;
      } else if (card.effect === "trap_freeze" || card.effect === "trap_snare") {
        score += 6 + mePressure * 0.9;
        score += pattern.summon * 3.2;
      } else if (card.effect === "lane_attune_fire" || card.effect === "lane_attune_water") {
        const wants = state.enemy.hand.filter((h) => h.type === "attack" && h.element === card.element).length;
        score += 3 + wants * 2.2;
        score += pattern.attack * 0.8;
      } else if (card.effect === "lane_scramble") {
        const oppStack = (laneRef.meTrack?.length || 0) + (laneRef.meNextBonus ? 2 : 0) + (laneRef.meAura?.expiresAt > state.gameTime ? 2 : 0);
        score += 4 + oppStack * 2;
        score += pattern.lane * 2.6;
      } else if (card.effect === "spell_spread_2" || card.effect === "spell_spread_3") {
        const atkInHand = playable.filter((x) => x.card.type === "attack").length;
        score += atkInHand >= 1 ? 8 : 1;
        if (state.enemy.nextAttackSpread > 1) score -= 8;
        score += pattern.generator * 1.1;
      } else if (card.effect?.startsWith("tower_")) {
        const ownTower = state.field.arrowTowers.find((t) => t.owner === "enemy" && t.lane === lane && t.hp > 0);
        score += ownTower ? 7 : -9;
        if (ownTower) score += (1 - ownTower.hp / Math.max(1, ownTower.maxHp || ownTower.hp)) * 5;
        score += pattern.summon * 1.9;
      }
    }

    score += followup * 1.35;
    score -= costTotal * 0.8;
    if (costTotal === 0) score += 1.2;
    if (comboReady) score += 2;
    return (score - laneRiskForEnemy(lane) * 0.8) * (ai.scoreMul || 1);
  }

  let best = null;
  playable.forEach((pick) => {
    const card = pick.card;
    const laneOptions = [0, 1, 2];
    laneOptions.forEach((lane) => {
      const sc = scorePlay(card, lane, pick.idx, pick.cost);
      if (!best || sc > best.score) {
        best = { pick, lane, score: sc };
      }
    });
  });

  if (!best) return;
  let pick = best.pick;
  let targetLane = chooseEnemyLane(best.lane, pick.card);

  if (needUrgentIntercept) {
    const urgent = playable
      .filter(({ card }) => canIntercept(card))
      .sort((a, b) => interceptFitScore(b.card, threat) - interceptFitScore(a.card, threat))[0];
    if (urgent) {
      pick = urgent;
      targetLane = chooseEnemyLane(threat.lane, urgent.card);
      logLine(`敌方AI紧急拦截【${threat.name}】。`);
    }
  }

  const target = { type: "lane", lane: targetLane, pos: 20 };
  payCost(state.enemy, pick.cost);
  const used = state.enemy.hand.splice(pick.idx, 1)[0];
  state.enemy.discard.push(used);
  const comboActive = evaluateComboOnCast("enemy", used);
  logComboCast("enemy", used, comboActive);
  if (used.effect !== "resource_card" && target?.type === "lane") {
    registerLaneElement("enemy", target.lane ?? 1, used.element);
  }
  if (!resolveUtilityCardInstant("enemy", used, target, comboActive)) {
    if (used.type === "attack") scheduleAttackWithSpread("enemy", used, target, comboActive);
    else scheduleAction("enemy", used, target, comboActive);
  }
  const castGap = Object.keys(pick.cost || {}).length === 0 ? (ai.zeroCostGap || 0.72) : 1.05 * (ai.castGapMul || 1);
  state.enemyCastLockUntil = state.gameTime + castGap;
}

function laneRiskForEnemy(lane) {
  let risk = 0;
  const myTraps = state.field.traps.filter((t) => t.owner === "me" && t.lane === lane);
  myTraps.forEach((t) => {
    risk += t.effect === "trap_snare" ? 2.2 : 1.5;
  });
  const hz = state.field.hazards[lane]?.type;
  if (hz === "frost") risk += 0.6;
  return risk;
}

function chooseEnemyLane(preferredLane = null, card = null) {
  const myWalls = state.field.walls.filter((w) => w.owner === "me");
  const myTowers = state.field.arrowTowers.filter((t) => t.owner === "me" && t.hp > 0);
  const mySummons = state.field.summons.filter((s) => s.owner === "me");
  if (card?.type === "attack" && (myWalls.length > 0 || myTowers.length > 0 || mySummons.length > 0)) {
    const structures = [
      ...myWalls.map((x) => ({ lane: x.lane, hp: x.hp })),
      ...myTowers.map((x) => ({ lane: x.lane, hp: x.hp * 1.15 })),
      ...mySummons.map((x) => ({ lane: x.lane, hp: x.hp * 0.85 }))
    ];
    const wallChoice = structures
      .slice()
      .sort((a, b) => (a.hp + laneRiskForEnemy(a.lane) * 5) - (b.hp + laneRiskForEnemy(b.lane) * 5))[0];
    if (wallChoice) return wallChoice.lane;
  }
  if (preferredLane !== null && preferredLane !== undefined) {
    const risk = laneRiskForEnemy(preferredLane);
    if (risk < 2.2) return preferredLane;
  }
  const lanes = Array.from({ length: LANE_COUNT }, (_, i) => i);
  lanes.sort((a, b) => laneRiskForEnemy(a) - laneRiskForEnemy(b));
  return lanes[0];
}

function findLaneTargetHitByAttack(act) {
  const defender = act.from === "me" ? "enemy" : "me";
  const walls = state.field.walls
    .filter((w) => w.owner === defender && w.lane === act.lane && w.hp > 0)
    .map((w) => ({ kind: "wall", ref: w, pos: w.pos }));
  const gens = state.field.generators
    .filter((g) => g.owner === defender && g.lane === act.lane && g.hp > 0)
    .map((g) => ({ kind: "gen", ref: g, pos: g.pos }));
  const towers = state.field.arrowTowers
    .filter((t) => t.owner === defender && t.lane === act.lane && t.hp > 0)
    .map((t) => ({ kind: "tower", ref: t, pos: t.pos }));
  const summons = state.field.summons
    .filter((s) => s.owner === defender && s.lane === act.lane && s.hp > 0)
    .map((s) => ({ kind: "summon", ref: s, pos: s.pos }));
  const targets = walls.concat(gens).concat(towers).concat(summons);
  if (!targets.length) return null;
  targets.sort((a, b) => (act.from === "me" ? a.pos - b.pos : b.pos - a.pos));
  return targets[0];
}

function applyAttackOnHitEffects(act, targetSide, dealt) {
  if (!act.effect || dealt <= 0) return;
  const attackerSide = act.from === "me" ? "my" : "enemy";
  const attacker = attackerSide === "my" ? state.my : state.enemy;
  const defender = targetSide === "enemy" ? state.enemy : state.my;
  if (act.effect === "gain_resource") {
    const gain = act.effectValue || 1.4;
    const pool = attacker.resources[act.element];
    pool.current = Math.min(pool.max, pool.current + gain);
    if (attackerSide === "my") {
      pushDecision({ title: `${act.name} 聚元`, damage: dealt, resource: gain, note: "命中后直接回收元素资源" });
    }
    logLine(`${act.name}命中后聚元：${act.from === "me" ? "我方" : "敌方"}获得${ELEMENT_NAME[act.element]}资源 ${gain.toFixed(1)}。`);
    return;
  }
  if (act.effect === "steal_resource") {
    const amount = act.effectValue || 1.2;
    const stolen = Math.min(amount, defender.resources[act.element].current);
    defender.resources[act.element].current = Math.max(0, defender.resources[act.element].current - stolen);
    attacker.resources[act.element].current = Math.min(attacker.resources[act.element].max, attacker.resources[act.element].current + stolen);
    if (attackerSide === "my") {
      pushDecision({ title: `${act.name} 掠夺`, damage: dealt, resource: stolen, note: `掠夺${ELEMENT_NAME[act.element]}资源` });
    }
    logLine(`${act.name}命中后掠夺：转移${ELEMENT_NAME[act.element]}资源 ${stolen.toFixed(1)}。`);
    return;
  }
  if (act.effect === "draw_on_hit") {
    const count = Math.max(1, Math.round(act.effectValue || 1));
    drawCards(attackerSide, count);
    if (attackerSide === "my") {
      pushDecision({ title: `${act.name} 过牌`, damage: dealt, note: `命中后抽牌 +${count}` });
    }
    logLine(`${act.name}命中后触发机运：${act.from === "me" ? "我方" : "敌方"}额外抽牌 ${count} 张。`);
  }
}

function executeDueActions() {
  const due = state.queue.filter((x) => x.dueAt <= state.gameTime);
  state.queue = state.queue.filter((x) => x.dueAt > state.gameTime);

  due.forEach((act) => {
    if (act.targetType === "projectile") {
      resolveProjectileIntercept(act);
      return;
    }

    if (act.type === "attack") {
      const target = act.from === "me" ? "enemy" : "my";
      const laneTarget = findLaneTargetHitByAttack(act);
      if (laneTarget) {
        const structureBefore = laneTarget.ref.hp;
        const hit = Math.max(4, Math.round((act.power || 8) * 0.8));
        laneTarget.ref.hp = Math.max(0, laneTarget.ref.hp - hit);
        const targetOwnerName = laneTarget.ref.owner === "enemy" ? "敌方" : "我方";
        const targetName = laneTarget.kind === "wall"
          ? "壁垒"
          : laneTarget.kind === "gen"
            ? `${ELEMENT_NAME[laneTarget.ref.element]}脉塔`
            : laneTarget.kind === "tower"
              ? "箭塔"
            : `召唤体${laneTarget.ref.name}`;
        logLine(`${act.name}命中${targetOwnerName}${targetName}，耐久 ${structureBefore} -> ${laneTarget.ref.hp}。`);
        if (laneTarget.ref.hp <= 0) {
          if (laneTarget.kind === "wall") {
            state.field.walls = state.field.walls.filter((w) => w.id !== laneTarget.ref.id);
          } else if (laneTarget.kind === "gen") {
            state.field.generators = state.field.generators.filter((g) => g.id !== laneTarget.ref.id);
          } else if (laneTarget.kind === "tower") {
            state.field.arrowTowers = state.field.arrowTowers.filter((t) => t.id !== laneTarget.ref.id);
          } else {
            state.field.summons = state.field.summons.filter((s) => s.id !== laneTarget.ref.id);
          }
          logLine(`${targetOwnerName}第${laneTarget.ref.lane + 1}线${targetName}已被击破。`);
        }
        if (act.from === "me") {
          pushDecision({
            title: `${act.name} 被前排阻挡`,
            prevent: 2,
            note: `第${act.lane + 1}线进攻被前排单位拦下`
          });
        }
        return;
      }
      const dmg = applyDamageByEnv(act, target);
      if (target === "enemy") state.enemyHp = Math.max(0, state.enemyHp - dmg);
      if (target === "my") state.myHp = Math.max(0, state.myHp - dmg);
      if (act.from === "me") {
        pushDecision({
          title: `${act.name} 命中`,
          damage: dmg,
          note: act.targetType === "hero" ? "直击角色" : "战场目标受击"
        });
      }
      triggerHitFx(target, dmg);
      logLine(`${act.name}命中，造成 ${dmg} 伤害。`);
      applyAttackOnHitEffects(act, target, dmg);
      return;
    }

    if (act.type === "control" && act.effect === "slow") {
      const targetFrom = act.from === "me" ? "enemy" : "me";
      const targetAction = state.queue.find((q) => q.from === targetFrom && q.lane === act.lane);
      if (targetAction) {
        const oldDue = targetAction.dueAt;
        targetAction.dueAt += 0.8;
        logLine(`${act.name}生效：${targetAction.name} 结算由 ${Math.max(0, oldDue - state.gameTime).toFixed(1)}s 延后到 ${Math.max(0, targetAction.dueAt - state.gameTime).toFixed(1)}s。`);
      } else {
        logLine(`${act.name}尝试控制，但当前没有可延后的敌方行动体。`);
      }
      return;
    }

    if (act.type === "defense" && act.effect === "block") {
      const enemyAct = state.queue.find((q) => q.from !== act.from && q.type === "attack" && q.lane === act.lane);
      if (enemyAct) {
        const oldPower = enemyAct.power || 0;
        enemyAct.power = Math.max(0, enemyAct.power - 6);
        logLine(`${act.name}生效：${enemyAct.name} 伤害 ${oldPower} -> ${enemyAct.power}。`);
      } else {
        logLine(`${act.name}已展开，但当前没有可削弱的敌方攻击行动体。`);
      }
      return;
    }

    if (act.type === "control" && act.effect === "counter") {
      const enemyAct = state.queue.find((q) => q.from !== act.from && q.type === "attack" && q.lane === act.lane);
      if (enemyAct) {
        enemyAct.from = act.from;
        enemyAct.name = `反弹-${enemyAct.name}`;
        enemyAct.power = enemyAct.power + (state.role?.id === "iron" ? 3 : 0);
        logLine(`${act.name}触发：将攻击反弹。`);
      } else {
        logLine(`${act.name}待机完成，但没有可反弹的攻击目标。`);
      }
    }
  });

  checkWinner();
}

function canIntercept(card) {
  return card.type === "control" || card.type === "defense" || card.type === "attack";
}

function pickHighestThreatProjectile(owner) {
  const list = state.queue.filter((q) => q.from === owner);
  if (!list.length) return null;
  return list
    .slice()
    .sort((a, b) => threatScore(b) - threatScore(a))[0];
}

function threatScore(action) {
  const timeLeft = Math.max(0.1, action.dueAt - state.gameTime);
  const power = action.power || 0;
  const attackBonus = action.type === "attack" ? 8 : 3;
  const urgency = 8 / timeLeft;
  return power * 1.2 + attackBonus + urgency;
}

function interceptFitScore(card, targetAction) {
  const overcomes = { wood: "earth", earth: "water", water: "fire", fire: "metal", metal: "wood" };
  let score = 10;
  if (overcomes[card.element] === targetAction.element) score += 8;
  if (overcomes[targetAction.element] === card.element) score -= 6;
  if (card.type === "control") score += 2;
  return score;
}

function resolveProjectileIntercept(act) {
  const targetOwner = act.from === "me" ? "enemy" : "me";
  let targetIdx = state.queue.findIndex((q) => q.id === act.targetId && q.from === targetOwner);
  if (targetIdx === -1) {
    // If the originally targeted projectile vanished, automatically switch to the nearest enemy projectile.
    targetIdx = state.queue.findIndex((q) => q.from === targetOwner);
  }
  if (targetIdx === -1) {
    const chip = Math.max(2, Math.round((act.power || 6) * 0.35));
    const chipTarget = targetOwner === "enemy" ? "enemy" : "my";
    if (chipTarget === "enemy") state.enemyHp = Math.max(0, state.enemyHp - chip);
    if (chipTarget === "my") state.myHp = Math.max(0, state.myHp - chip);
    triggerHitFx(chipTarget, chip);
    logLine(`${act.name}未找到可拦截目标，转为压制对方，造成 ${chip} 点伤害。`);
    return;
  }
  const targetAct = state.queue[targetIdx];
  const overcomes = { wood: "earth", earth: "water", water: "fire", fire: "metal", metal: "wood" };
  const actWins = overcomes[act.element] === targetAct.element;
  const targetWins = overcomes[targetAct.element] === act.element;
  const splashTarget = targetOwner === "enemy" ? "enemy" : "my";

  if (actWins) {
    state.queue.splice(targetIdx, 1);
    const splash = Math.max(4, Math.round((act.power || 6) * 0.6));
    if (splashTarget === "enemy") state.enemyHp = Math.max(0, state.enemyHp - splash);
    if (splashTarget === "my") state.myHp = Math.max(0, state.myHp - splash);
    triggerHitFx(splashTarget, splash);
    // Collateral pressure: slightly delays another enemy projectile if any.
    const another = state.queue.find((q) => q.from === targetOwner);
    if (another) another.dueAt += 0.6;
    applyInterceptReward(act, "strong");
    logLine(`${act.name}强力拦截【${targetAct.name}】，目标被击毁，并造成 ${splash} 点溅射伤害。`);
    return;
  }

  if (targetWins) {
    targetAct.power = Math.max(0, (targetAct.power || 0) - 2);
    targetAct.dueAt += 0.35;
    applyInterceptReward(act, "weak");
    logLine(`${act.name}被【${targetAct.name}】压制，但仍削弱其威力并略微延后。`);
    return;
  }

  targetAct.power = Math.max(0, (targetAct.power || 0) - Math.max(3, Math.round((act.power || 6) * 0.55)));
  targetAct.dueAt += 0.9;
  applyInterceptReward(act, "normal");
  logLine(`${act.name}拦截命中【${targetAct.name}】，显著削弱并延后其结算。`);
}

function applyInterceptReward(act, level) {
  const self = act.from === "me" ? state.my : state.enemy;
  const owner = act.from === "me" ? "我方" : "敌方";
  let regain = level === "strong" ? 0.9 : level === "normal" ? 0.6 : 0.35;
  let cdCut = level === "strong" ? 0.45 : level === "normal" ? 0.3 : 0.18;
  if (state.battlefieldEvent.id === "aegis") {
    regain *= 1.25;
    cdCut *= 1.2;
  }
  if (act.from === "me" && state.role?.id === "iron") {
    regain += 0.2;
    cdCut += 0.06;
  }
  const pool = self.resources[act.element];
  pool.current = Math.min(pool.max, pool.current + regain);
  if (act.from === "me") {
    state.myCastLockUntil = Math.max(state.gameTime, state.myCastLockUntil - cdCut);
    pushDecision({
      title: `${act.name} 拦截收益`,
      prevent: level === "strong" ? 8 : level === "normal" ? 5 : 3,
      resource: regain,
      cd: cdCut,
      note: `拦截评级：${level}`
    });
  } else {
    state.enemyCastLockUntil = Math.max(state.gameTime, state.enemyCastLockUntil - cdCut * 0.8);
  }
  logLine(`${owner}拦截收益：${ELEMENT_NAME[act.element]}资源+${regain.toFixed(1)}，出牌冷却-${cdCut.toFixed(2)}s。`);
}

function getHeroScreenFactor(defenderSide) {
  const screenCount = state.queue.filter((q) => q.from === defenderSide).length;
  if (screenCount <= 0) return 1;
  // Active projectiles provide battlefield cover. Direct-face damage is heavily reduced.
  const factor = Math.max(0.22, 1 - 0.32 * screenCount);
  return factor;
}

function applyDamageByEnv(act, targetSide) {
  let dmg = act.power || 0;
  dmg += act.hazardBonus || 0;
  if (act.targetType === "hero") {
    const defender = targetSide === "enemy" ? "enemy" : "me";
    const screenFactor = getHeroScreenFactor(defender);
    const eventFaceNerf = state.battlefieldEvent.id === "aegis" ? 0.7 : 1;
    let rolePierce = 1;
    if (act.from === "me" && state.role?.id === "blaze" && act.element === "fire") {
      rolePierce = 1.18;
    }
    if (screenFactor < 1) {
      dmg *= screenFactor * eventFaceNerf * rolePierce;
      const enemyCount = state.queue.filter((q) => q.from === defender).length;
      logLine(`直击受掩护影响：目标侧有 ${enemyCount} 个飞行行动体，伤害衰减至 ${Math.round(screenFactor * 100)}%。`);
    } else {
      dmg *= eventFaceNerf * rolePierce;
    }
  }
  if (state.env.main.type === "earth") dmg += Math.round(state.env.main.power * 0.7);
  if (state.env.sub.type === "water" && act.element === "fire") dmg = Math.max(0, dmg - 2);
  return Math.max(0, Math.round(dmg));
}

function checkWinner() {
  if (state.enemyHp <= 0 && state.myHp <= 0) {
    finishBattle("draw");
    return;
  }
  if (state.enemyHp <= 0) {
    finishBattle("my");
    return;
  }
  if (state.myHp <= 0) {
    finishBattle("enemy");
  }
}

function playIntroOverlay() {
  if (!el.introOverlay) return;
  el.introOverlay.classList.remove("active");
  // Force reflow to restart css animation.
  void el.introOverlay.offsetWidth;
  el.introOverlay.classList.add("active");
}

function showResultModal(winner) {
  if (!el.resultModal) return;
  if (el.resultTitle) {
    if (winner === "my") el.resultTitle.textContent = "我方胜利";
    else if (winner === "enemy") el.resultTitle.textContent = "敌方胜利";
    else el.resultTitle.textContent = "平局";
  }
  if (el.resultDesc) {
    if (winner === "my") el.resultDesc.textContent = "战术执行成功，继续下一场演算。";
    else if (winner === "enemy") el.resultDesc.textContent = "防线失守，本局结束。";
    else el.resultDesc.textContent = "双方同时归零，本局平局。";
  }
  if (el.resultMyHp) el.resultMyHp.textContent = `${state.myHp.toFixed(0)}`;
  if (el.resultEnemyHp) el.resultEnemyHp.textContent = `${state.enemyHp.toFixed(0)}`;
  if (el.resultTime) el.resultTime.textContent = `${state.gameTime.toFixed(1)}s`;
  el.resultModal.classList.add("show");
  el.resultModal.setAttribute("aria-hidden", "false");
}

function hideResultModal() {
  if (!el.resultModal) return;
  el.resultModal.classList.remove("show");
  el.resultModal.setAttribute("aria-hidden", "true");
}

function finishBattle(winner, fromNet = false) {
  if (!state.running) return;
  state.running = false;
  stopLoop();
  el.btnNext.textContent = "继续";
  if (isOnlineMode()) {
    net.myReady = false;
    net.peerReady = false;
  }
  if (winner === "my") logLine("我方胜利！");
  else if (winner === "enemy") logLine("敌方胜利！");
  else logLine("本局平局。");
  showResultModal(winner);
  if (isOnlineMode() && net.role === "host" && !fromNet) {
    netSend("battle_over", { winner });
  }
}

function decayEnvironment() {
  [state.env.main, state.env.sub].forEach((e) => {
    if (e.power > 0) e.power -= 1;
  });
  logLine(`环境衰减：主环境${ELEMENT_NAME[state.env.main.type]}(${state.env.main.power})，副环境${ELEMENT_NAME[state.env.sub.type]}(${state.env.sub.power})。`);
}

function triggerHitFx(target, dmg) {
  const key = target === "my" ? "my" : "enemy";
  state.hitFx[key] = state.gameTime + 0.32;
  state.floatTexts.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    target: key,
    text: `-${Math.round(dmg)}`,
    startAt: state.gameTime,
    expiresAt: state.gameTime + 0.85
  });
}

function renderDeckBuilder() {
  if (!el.deckBuilderList) return;
  const total = getDeckCount();
  if (el.deckCount) {
    el.deckCount.textContent = `${total} / ${state.deckBuilder.maxSize}（最少 ${state.deckBuilder.minSize}）`;
    const ok = total >= state.deckBuilder.minSize && total <= state.deckBuilder.maxSize;
    el.deckCount.className = `deck-count ${ok ? "ok" : "warn"}`;
  }
  updateStartButtonState();

  el.deckBuilderList.innerHTML = CARD_POOL.map((c) => {
    const count = Math.max(0, Math.floor(state.deckBuilder.counts[c.id] || 0));
    const canInc = count < state.deckBuilder.maxPerCard && total < state.deckBuilder.maxSize;
    const canDec = count > 0;
    return `
      <div class="deck-card ${count > 0 ? "selected" : ""}">
        <div class="deck-card-head">
          <strong><span class="card-mini-icon">${getCardIcon(c)}</span>${c.name}</strong>
          <span class="tag ${c.element}">${ELEMENT_NAME[c.element]}</span>
        </div>
        <div class="deck-card-meta">${c.type} | 费用 ${Object.entries(c.cost).map(([k, v]) => `${ELEMENT_NAME[k]}:${v}`).join(" ")}</div>
        <div class="deck-card-ops">
          <button class="btn deck-op" data-op="dec" data-id="${c.id}" ${canDec ? "" : "disabled"}>-</button>
          <span class="deck-num">${count}</span>
          <button class="btn deck-op" data-op="inc" data-id="${c.id}" ${canInc ? "" : "disabled"}>+</button>
        </div>
      </div>
    `;
  }).join("");

  el.deckBuilderList.querySelectorAll(".deck-op").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const op = btn.dataset.op;
      const cur = Math.max(0, Math.floor(state.deckBuilder.counts[id] || 0));
      const totalNow = getDeckCount();
      if (op === "inc") {
        if (cur >= state.deckBuilder.maxPerCard) return;
        if (totalNow >= state.deckBuilder.maxSize) return;
        state.deckBuilder.counts[id] = cur + 1;
      } else {
        if (cur <= 0) return;
        state.deckBuilder.counts[id] = cur - 1;
      }
      saveDeckBuilderCache();
      renderDeckBuilder();
    });
  });
}

function renderRoles() {
  const roleMark = { blaze: "炎", tide: "潮", iron: "铸" };
  el.roleList.innerHTML = ROLE_LIST.map((r) => `
    <div class="role role-card ${r.id} ${state.role?.id === r.id ? "active" : ""}">
      <div class="role-head">
        <div class="role-portrait">${roleMark[r.id] || "者"}</div>
        <div class="role-title">
          <strong>${r.name}</strong>
          <span class="tag ${r.main}">${ELEMENT_NAME[r.main]}系</span>
        </div>
        <span class="role-stamp">印</span>
      </div>
      <div class="role-passive">被动: ${r.passive}</div>
      <div class="role-meter"><span></span></div>
      <button data-role="${r.id}">选用</button>
    </div>
  `).join("");

  el.roleList.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const roleId = btn.dataset.role;
      state.role = ROLE_LIST.find((x) => x.id === roleId);
      logLine(`已选择角色：${state.role.name}`);
      render();
    });
  });
}

function renderCards() {
  const view = getHandViewIndices();
  el.hand.innerHTML = view.map(({ card: c, idx: i }) => {
    const cost = getCostAfterRole(c);
    const affordable = canPay(state.my, cost) && state.running && !state.pendingCast && state.gameTime >= state.myCastLockUntil && state.gameTime >= state.myDiscardLockUntil;
    const manaTotal = Object.values(cost).reduce((sum, v) => sum + Number(v || 0), 0);
    const sealText = c.type === "attack" ? "战" : c.type === "control" ? "策" : c.type === "defense" ? "御" : "机";
    const costText = Object.entries(cost)
      .map(([k, v]) => `${ELEMENT_NAME[k]}:${v}`)
      .join(" ");
    const costLine = costText || "无消耗";
    const instantTag = cardNeedsLaneTarget(c) ? "" : '<span class="card-instant-tag">即时</span>';

    return `
      <div class="card ${c.element} ${c.type} ${affordable ? "drag-ready" : "drag-disabled"} ${state.armedCardIndex === i ? "armed-card" : ""}" data-idx="${i}" draggable="false">
        <div class="card-gem">${manaTotal}</div>
        <div class="card-top-banner">
          <span class="card-class-tag">${ELEMENT_NAME[c.element]}系</span>
          <span class="card-seal">${sealText}</span>
        </div>
        <div class="card-title">${c.name}</div>
        ${instantTag}
        <div class="card-art">
          <span class="card-art-icon">${getCardIcon(c)}</span>
        </div>
        <div class="card-textbox">
          <div class="card-subline">${c.type} · 飞行 ${c.baseDelay.toFixed(1)}s</div>
          <div class="card-subline">强度：${(c.power ?? 0) > 0 ? (c.power ?? 0) : "功能牌"}</div>
          <div class="card-desc">${c.desc || "无额外描述"}</div>
        </div>
        ${c.comboStarter ? `<div class="card-combo">起手连携：${c.comboLabel}</div>` : ""}
        ${c.comboConsumer ? `<div class="card-combo">终结连携：${c.comboLabel}</div>` : ""}
        <div class="card-cost-line">消耗：${costLine}</div>
        <button class="card-discard" data-discard="${i}" type="button">弃卡回能</button>
        <div class="drag-tip">${affordable ? "拖拽到通道格子使用" : "资源不足/冷却中"}</div>
      </div>
    `;
  }).join("");

  if (!state.my.hand.length) {
    el.hand.innerHTML = '<div class="card"><div><strong>暂无手牌</strong></div><div>等待抽牌...</div></div>';
  } else if (!view.length) {
    el.hand.innerHTML = '<div class="card"><div><strong>无匹配手牌</strong></div><div>调整筛选条件后重试。</div></div>';
  }

  el.hand.querySelectorAll(".card[data-idx]").forEach((cardEl) => {
    const idx = Number(cardEl.dataset.idx);
    cardEl.addEventListener("pointerdown", (ev) => {
      beginPointerDrag(idx, cardEl, ev);
    });
    cardEl.addEventListener("click", () => {
      if (state.suppressCardClick) return;
      const card = state.my.hand[idx];
      if (card && !cardNeedsLaneTarget(card)) {
        playCardFromHand(idx, null, { type: "instant" });
        return;
      }
      setArmedCard(idx);
    });
    cardEl.addEventListener("pointerup", () => {
      cardEl.classList.remove("dragging-card");
    });
    cardEl.addEventListener("mouseenter", () => {
      state.hoverCardIndex = idx;
      updateLaneRecommendation();
      if (el.handIntel) el.handIntel.textContent = state.laneReco.text;
      if (state.armedCardIndex === null) renderTimeline();
    });
    cardEl.addEventListener("mouseleave", () => {
      if (state.hoverCardIndex === idx) state.hoverCardIndex = null;
      updateLaneRecommendation();
      if (el.handIntel) el.handIntel.textContent = state.laneReco.text;
      if (state.armedCardIndex === null) renderTimeline();
    });
  });

  el.hand.querySelectorAll(".card-discard[data-discard]").forEach((btn) => {
    btn.addEventListener("pointerdown", (ev) => {
      ev.stopPropagation();
    });
    btn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      const idx = Number(btn.dataset.discard);
      discardCardFromHand(idx);
    });
  });
}

function updateHandAffordability() {
  const cards = el.hand.querySelectorAll(".card[data-idx]");
  cards.forEach((cardEl) => {
    const idx = Number(cardEl.dataset.idx);
    const card = state.my.hand[idx];
    if (!card) {
      cardEl.classList.remove("drag-ready");
      cardEl.classList.add("drag-disabled");
      cardEl.setAttribute("draggable", "false");
      return;
    }
    const cost = getCostAfterRole(card);
    const affordable = state.running && !state.pendingCast && state.gameTime >= state.myCastLockUntil && state.gameTime >= state.myDiscardLockUntil && canPay(state.my, cost);
    cardEl.classList.toggle("drag-ready", affordable);
    cardEl.classList.toggle("drag-disabled", !affordable);
    cardEl.setAttribute("draggable", "false");
    const tip = cardEl.querySelector(".drag-tip");
    if (tip) tip.textContent = affordable ? "拖拽到通道格子使用" : "资源不足/冷却中，可弃卡回能";
  });
}

function renderResources() {
  if (!el.resourceBoard) return;
  el.resourceBoard.innerHTML = ELEMENTS.map((e) => {
    const cur = state.my.resources[e].current;
    const max = state.my.resources[e].max;
    const pct = (cur / max) * 100;
    return `
      <div class="res-mini ${e}" title="${ELEMENT_NAME[e]} ${cur.toFixed(1)} / ${max}">
        <div class="res-mini-head">
          <span class="res-mini-glyph">${ELEMENT_ICON[e]}</span>
          <span>${ELEMENT_NAME[e]}</span>
        </div>
        <div class="res-mini-bar"><span style="width:${pct}%"></span></div>
        <div class="res-mini-text">${cur.toFixed(1)}/${max}</div>
      </div>
    `;
  }).join("");
}

function renderRecentElements() {
  if (!el.recentElements) return;
  if (!state.sharedRecentElements.length) {
    el.recentElements.innerHTML = '<div class="recent-empty">-</div>';
    return;
  }
  el.recentElements.innerHTML = state.sharedRecentElements
    .map((element) => `
      <div class="recent-element" title="战线元素：${ELEMENT_NAME[element]}">
        <span class="recent-icon">${ELEMENT_ICON[element]}</span>
      </div>
    `)
    .join("");
}

function renderTimeline() {
  const lanes = Array.from({ length: LANE_COUNT }, (_, lane) => {
    const hz = state.field.hazards[lane]?.type || "clear";
    const hzLabel = hz === "frost" ? "霜冻" : hz === "blaze" ? "灼热" : "平地";
    const theme = LANE_THEME[lane] || { name: `第${lane + 1}线`, mark: "阵" };
    const laneRef = getLaneRef(lane);
    const meAuraText = laneRef.meAura?.element && laneRef.meAura.expiresAt > state.gameTime
      ? `我方调谐:${ELEMENT_NAME[laneRef.meAura.element]}`
      : "我方调谐:-";
    const enemyAuraText = laneRef.enemyAura?.element && laneRef.enemyAura.expiresAt > state.gameTime
      ? `敌方调谐:${ELEMENT_NAME[laneRef.enemyAura.element]}`
      : "敌方调谐:-";
    const meBonusText = laneRef.meNextBonus?.element ? `我方强化:${ELEMENT_NAME[laneRef.meNextBonus.element]}` : "我方强化:-";
    const enemyBonusText = laneRef.enemyNextBonus?.element ? `敌方强化:${ELEMENT_NAME[laneRef.enemyNextBonus.element]}` : "敌方强化:-";
    const reco = state.laneReco?.lanes?.includes(lane);
    const recoScore = state.laneReco?.scoreByLane?.[lane] ?? 0;
    const recoReason = state.laneReco?.reasonByLane?.[lane] || "";
    const laneTitle = `${theme.name}｜地形:${hzLabel}｜${meBonusText}｜${enemyBonusText}｜${meAuraText}｜${enemyAuraText}${reco ? `｜推荐:${recoReason}` : ""}`;
    const actions = state.queue
      .filter((q) => q.lane === lane)
      .sort((a, b) => a.dueAt - b.dueAt)
      .map((q) => {
        const total = Math.max(0.1, q.dueAt - q.launchedAt);
        const progress = Math.max(0, Math.min(1, (state.gameTime - q.launchedAt) / total));
        const topPercent = q.from === "me" ? (1 - progress) * 100 : progress * 100;
        return `
          <div class="projectile ${q.from} ${q.element} ${q.comboActive ? "combo" : ""}" style="top: calc(${topPercent}% - 22px);" title="${q.name}">
            <div class="projectile-visual ${q.visualKind || "orb"}">${q.visualIcon || ELEMENT_ICON[q.element] || "✦"}</div>
            <div class="projectile-name">${q.name}</div>
            <div class="projectile-meta">${ELEMENT_NAME[q.element]} | ${Math.max(0, q.dueAt - state.gameTime).toFixed(1)}s ${q.comboLabel ? `| 连携:${q.comboLabel}` : ""}</div>
          </div>
        `;
      }).join("");

    const walls = state.field.walls
      .filter((w) => w.lane === lane)
      .map((w) => `
        <div class="lane-wall ${w.owner}" style="top: calc(${100 - w.pos}% - 20px);">
          <div>壁垒</div>
          <div>HP ${Math.round(w.hp)}</div>
        </div>
      `).join("");

    const towers = state.field.arrowTowers
      .filter((t) => t.lane === lane && t.hp > 0)
      .map((t) => `
        <div class="lane-arrow-tower ${t.owner} ${state.gameTime - t.lastHitAt < 0.16 ? "firing" : ""}" style="top: calc(${100 - t.pos}% - 23px);">
          <div class="tower-name">箭塔</div>
          <div class="tower-bar"><span style="width:${Math.max(0, Math.min(100, (t.hp / Math.max(1, t.maxHp || t.hp)) * 100))}%"></span></div>
          <div class="tower-meta">HP ${Math.round(t.hp)}</div>
        </div>
      `).join("");

    const occupied = new Set();
    state.field.walls.filter((w) => w.lane === lane).forEach((w) => occupied.add(Number.isInteger(w.slot) ? w.slot : posToSlot(w.pos)));
    state.field.generators.filter((g) => g.lane === lane).forEach((g) => occupied.add(Number.isInteger(g.slot) ? g.slot : posToSlot(g.pos)));
    state.field.arrowTowers.filter((t) => t.lane === lane && t.hp > 0).forEach((t) => occupied.add(Number.isInteger(t.slot) ? t.slot : posToSlot(t.pos)));
    const tiles = Array.from({ length: LANE_TILE_COUNT }, (_, row) => {
      const slot = LANE_TILE_COUNT - 1 - row;
      return `<div class="drop-slot ${occupied.has(slot) ? "occupied" : ""}" data-lane="${lane}" data-slot="${slot}"></div>`;
    }).join("");

    const generators = state.field.generators
      .filter((g) => g.lane === lane)
      .map((g) => `
        <div class="lane-generator ${g.owner} ${g.element}" style="top: calc(${100 - g.pos}% - 20px);">
          <div>${ELEMENT_NAME[g.element]}脉塔</div>
          <div>HP ${Math.round(g.hp)}</div>
        </div>
      `).join("");

    const summons = state.field.summons
      .filter((s) => s.lane === lane)
      .map((s) => `
        <div class="lane-summon ${s.owner} ${s.element} ${state.gameTime - s.bornAt < 0.7 ? "entry" : ""} ${state.gameTime - s.lastHitAt < 0.25 ? "hit" : ""}" style="top: calc(${100 - s.pos}% - 18px);">
          <div class="summon-avatar">${getSummonAvatar(s.summonKind, s.element)}</div>
          <div class="summon-name">${s.name}</div>
          <div class="summon-bar"><span style="width:${Math.max(0, Math.min(100, (s.hp / Math.max(1, s.maxHp || s.hp)) * 100))}%"></span></div>
          <div class="summon-meta">${formatSummonGoalTag(s)} | HP ${Math.round(s.hp)}</div>
        </div>
      `).join("");

    const traps = state.field.traps
      .filter((t) => t.lane === lane)
      .map((t) => `
        <div class="lane-trap ${t.owner}" style="top: calc(${100 - t.pos}% - 17px);">
          <div>${t.effect === "trap_freeze" ? "冰" : "缚"}</div>
          <div>x${t.charges}</div>
        </div>
      `).join("");

    const shots = state.field.arrowShots
      .filter((x) => x.lane === lane)
      .map((x) => {
        const length = Math.max(10, Math.abs(x.toPos - x.fromPos));
        const center = 100 - (x.fromPos + x.toPos) / 2;
        return `<div class="lane-arrow-shot ${x.owner}" style="top: calc(${center}% - ${length / 2}%); height: ${length}%;"></div>`;
      }).join("");

    return `
      <div class="lane-row lane-theme-${lane + 1}">
        <div class="lane-label">
          <button class="lane-pill ${reco ? "reco" : ""}" type="button" tabindex="-1" title="${laneTitle}">
            <span class="lane-pill-mark">${theme.mark}</span>
            <span class="lane-pill-hazard ${hz}">${hz === "frost" ? "❄" : hz === "blaze" ? "🔥" : "◌"}</span>
            <span class="lane-pill-reco">${reco ? `★${recoScore.toFixed(1)}` : ""}</span>
          </button>
        </div>
        <div class="lane-row-track drop-lane ${hz} ${reco ? "lane-recommended" : ""}" data-lane="${lane}" title="${reco ? recoReason : ""}">
          <div class="lane-tiles">${tiles}</div>
          ${actions || '<div class="lane-empty">该线暂无行动体</div>'}
          ${walls}
          ${towers}
          ${generators}
          ${summons}
          ${traps}
          ${shots}
        </div>
      </div>
    `;
  }).join("");

  el.timeline.innerHTML = `<div class="lane-board">${lanes}</div>`;
  bindDropTargets();
}

function bindDropTargets() {
  // Pointer-drag mode: target detection runs in global pointer handlers.
}

function clearDropHighlights() {
  el.timeline.querySelectorAll(".drop-active").forEach((n) => n.classList.remove("drop-active"));
}

function pickNearestEnemyProjectileId(ev) {
  return pickNearestEnemyProjectileIdByClientX(ev.clientX);
}

function pickNearestEnemyProjectileIdByClientX(clientX) {
  const lane = el.timeline.querySelector(".flight-lane");
  if (!lane || state.enemyProjectileTrack.length === 0) return null;
  const rect = lane.getBoundingClientRect();
  const dropPercent = ((clientX - rect.left) / rect.width) * 100;
  const nearest = state.enemyProjectileTrack
    .map((x) => ({ ...x, distPx: Math.abs(x.leftPercent - dropPercent) * rect.width / 100 }))
    .sort((a, b) => a.distPx - b.distPx)[0];
  if (!nearest || nearest.distPx > 120) return null;
  return nearest.id;
}

document.addEventListener("pointermove", movePointerDrag);
document.addEventListener("pointerup", endPointerDrag);
if (el.timeline) {
  el.timeline.addEventListener("click", (ev) => {
    if (!isBattleActive()) return;
    if (!state.armedCardIndex && state.armedCardIndex !== 0) return;
    const target = getLaneTargetFromEvent(ev);
    if (!target) return;
    tryCastArmedTarget(target);
  });
}
document.addEventListener("keydown", (ev) => {
  if (!isBattleActive()) return;
  const tag = ev.target?.tagName?.toLowerCase();
  if (tag === "input" || tag === "textarea" || ev.target?.isContentEditable) return;
  const key = ev.key.toLowerCase();
  if (key >= "1" && key <= "7") {
    const pos = Number(key) - 1;
    const view = getHandViewIndices();
    const idx = view[pos]?.idx;
    if (Number.isInteger(idx)) setArmedCard(idx);
    ev.preventDefault();
    return;
  }
  if (key === "q" || key === "w" || key === "e") {
    const lane = key === "q" ? 0 : key === "w" ? 1 : 2;
    tryCastArmedTarget({ type: "lane", lane, pos: 80 });
    ev.preventDefault();
    return;
  }
  if (key === "escape") {
    clearArmedCard();
    ev.preventDefault();
  }
});

function renderEnv() {
  if (!el.mainEnv || !el.subEnv) return;
  el.mainEnv.innerHTML = `
    <div>主环境：<strong>${ELEMENT_NAME[state.env.main.type]}</strong></div>
    <div>强度：${state.env.main.power}</div>
  `;
  el.subEnv.innerHTML = `
    <div>副环境：<strong>${ELEMENT_NAME[state.env.sub.type]}</strong></div>
    <div>强度：${state.env.sub.power}</div>
  `;
}

function renderStatus() {
  el.myHp.textContent = `${state.myHp.toFixed(0)}`;
  el.enemyHp.textContent = `${state.enemyHp.toFixed(0)}`;
  const myHpPct = Math.max(0, Math.min(100, state.myHp));
  const enemyHpPct = Math.max(0, Math.min(100, state.enemyHp));
  if (el.myHpBar) el.myHpBar.style.width = `${myHpPct}%`;
  if (el.enemyHpBar) el.enemyHpBar.style.width = `${enemyHpPct}%`;
  if (el.myRoleName) el.myRoleName.textContent = state.role ? `${state.role.name} | ${ELEMENT_NAME[state.role.main]}系` : "未选流派";
  if (el.enemyRoleName) el.enemyRoleName.textContent = "战域傀儡";
  el.tick.textContent = `${state.gameTime.toFixed(1)}s`;
  el.deckInfo.textContent = `${state.my.deck.length} / ${state.my.discard.length}`;
  el.handCount.textContent = `${state.my.hand.length}`;
  const cd = Math.max(
    0,
    state.myCastLockUntil - state.gameTime,
    state.myDiscardLockUntil - state.gameTime
  );
  el.castCd.textContent = `${cd.toFixed(1)}s`;
  if (el.eventName) el.eventName.textContent = `${state.battlefieldEvent.name}`;
  if (el.battleAlert) {
    let alertText = "";
    let level = "quiet";
    if (state.myHp <= 25 && state.enemyHp <= 25) {
      alertText = "双方生命均已低于 25，进入决胜窗口。";
      level = "hot";
    } else if (state.myHp <= 25) {
      alertText = "我方生命低于 25，建议优先防守与反制。";
      level = "danger";
    } else if (state.enemyHp <= 25) {
      alertText = "敌方生命低于 25，可切换终结压制。";
      level = "adv";
    } else if (Math.abs(state.myHp - state.enemyHp) >= 24) {
      alertText = state.myHp > state.enemyHp ? "我方血线优势显著，可转持续施压。" : "我方血线劣势明显，建议回收资源稳住。";
      level = "warn";
    }
    el.battleAlert.textContent = alertText;
    el.battleAlert.className = `battle-alert ${level} ${alertText ? "show" : ""}`;
  }
}

function renderDecisionFeed() {
  if (!el.decisionFeed) return;
  if (!state.decisionFeed.length) {
    el.decisionFeed.innerHTML = '<div class="decision-card"><div class="decision-head"><div class="decision-title">暂无记录</div><span class="decision-badge neutral">待</span></div><div class="decision-meta">开始战斗后将显示最近3次决策收益。</div></div>';
    return;
  }
  el.decisionFeed.innerHTML = state.decisionFeed.map((d) => `
    <div class="decision-card ${d.good ? "good" : "bad"}">
      <div class="decision-head">
        <div class="decision-title">[${d.time}s] ${d.title}</div>
        <span class="decision-badge ${d.good ? "good" : "bad"}">${d.good ? "利" : "险"}</span>
      </div>
      <div class="decision-meta">伤害 +${d.damage.toFixed(1)} | 减伤 +${d.prevent.toFixed(1)}</div>
      <div class="decision-meta">资源 +${d.resource.toFixed(1)} | 冷却 -${d.cd.toFixed(2)}s</div>
      <div class="decision-meta">${d.note}</div>
    </div>
  `).join("");
}

function renderRuntime() {
  updateLaneRecommendation();
  if (el.handIntel) el.handIntel.textContent = state.laneReco.text;
  renderResources();
  renderRecentElements();
  updateHandAffordability();
  renderTimeline();
  renderEnv();
  renderStatus();
  renderDecisionFeed();
}

function render() {
  renderDeckBuilder();
  renderRoles();
  renderCards();
  renderRuntime();
}

el.btnStart.addEventListener("click", async () => {
  if (net.mode === "online") {
    if (!net.connected) {
      pushLobbyEvent("未连接房间，自动创建房间中...");
      await createOnlineRoom();
      if (!net.connected) {
        setNetStatus("创建房间失败，请检查服务");
        setPrepNotice("创建房间失败。请确认已运行 node server.js 且通过 http://localhost:8080 打开。", true);
        pushLobbyEvent("无法开始：自动建房失败。");
        updateStartButtonState();
        return;
      }
      setPrepNotice("已自动建房，请让对手加入后再开始。", false);
      updateStartButtonState();
      return;
    }
    if (net.role !== "host") {
      setMyReady(!net.myReady);
      setNetStatus(net.myReady ? "你已准备，等待房主开战" : "你已取消准备");
      pushLobbyEvent(net.myReady ? "已准备，等待房主开战。" : "已取消准备。");
      updateStartButtonState();
      return;
    }
    if (!net.myReady) setMyReady(true);
    if (!net.peerOnline && net.peerCount < 2) {
      setNetStatus("对手未加入");
      setPrepNotice("对手未加入，暂时无法开始。", true);
      pushLobbyEvent("无法开始：对手未加入。");
      updateStartButtonState();
      return;
    }
    if (!net.peerReady) {
      setNetStatus("你已准备，等待对手准备");
      setPrepNotice("你已准备，等待对手准备。", false);
      pushLobbyEvent("等待对手准备。");
      updateStartButtonState();
      return;
    }
  }
  if (net.mode === "online") pushLobbyEvent("房主开始战斗。");
  resetBattle();
  updateStartButtonState();
});
el.btnNext.addEventListener("click", togglePause);
if (el.battleSpeed) {
  el.battleSpeed.addEventListener("change", () => {
    const next = Number(el.battleSpeed.value || "1");
    if (isOnlineMode()) {
      state.simSpeed = 1;
      updateBattleControlState();
      return;
    }
    if (!Number.isFinite(next) || next <= 0) return;
    state.simSpeed = Math.max(0.5, Math.min(2, next));
    updateBattleControlState();
    logLine(`演算速度已切换为 ${state.simSpeed.toFixed(1)}x。`);
  });
}
if (el.aiDifficulty) {
  el.aiDifficulty.addEventListener("change", () => {
    const next = String(el.aiDifficulty.value || "normal");
    if (!AI_DIFFICULTY[next]) {
      el.aiDifficulty.value = state.aiDifficulty;
      return;
    }
    state.aiDifficulty = next;
    updateBattleControlState();
    if (!isOnlineMode()) {
      const ai = getAiProfile();
      logLine(`AI难度切换为${ai.label}：决策间隔 ${ai.thinkInterval.toFixed(2)}s。`);
    }
  });
}
if (el.btnFxLite) {
  el.btnFxLite.addEventListener("click", () => {
    state.reducedFx = !state.reducedFx;
    updateBattleControlState();
    logLine(state.reducedFx ? "已启用简化特效模式。" : "已关闭简化特效模式。");
  });
}
if (el.btnThemeCartoon) {
  el.btnThemeCartoon.addEventListener("click", () => {
    state.cartoonTheme = state.cartoonTheme === "soft" ? "vivid" : "soft";
    updateBattleControlState();
    logLine(`界面风格已切换为${state.cartoonTheme === "vivid" ? "鲜明卡通" : "柔和卡通"}。`);
  });
}
if (el.btnBackPrep) {
  el.btnBackPrep.addEventListener("click", () => {
    state.running = false;
    stopLoop();
    el.btnNext.textContent = "继续";
    setScreen("prep");
    logLine("已返回备战界面。");
  });
}
if (el.btnRematch) {
  el.btnRematch.addEventListener("click", () => {
    if (!isOnlineMode()) {
      resetBattle();
      return;
    }
    net.myRematch = !net.myRematch;
    netSend("rematch_ready", { ready: net.myRematch });
    setNetStatus(net.myRematch ? "你已确认再来一局，等待对手" : "已取消再来一局");
  });
}
if (el.btnCloseResult) el.btnCloseResult.addEventListener("click", hideResultModal);
if (el.btnDeckDefault) {
  el.btnDeckDefault.addEventListener("click", () => {
    setDeckToDefault();
    saveDeckBuilderCache();
    renderDeckBuilder();
    logLine("已恢复默认卡组。");
  });
}
if (el.btnModeLocal) el.btnModeLocal.addEventListener("click", switchToLocalMode);
if (el.btnModeOnline) el.btnModeOnline.addEventListener("click", switchToOnlineMode);
if (el.btnCreateRoom) el.btnCreateRoom.addEventListener("click", () => { createOnlineRoom(); });
if (el.btnJoinRoom) el.btnJoinRoom.addEventListener("click", () => { joinOnlineRoom(); });
if (el.btnCopyInvite) {
  el.btnCopyInvite.addEventListener("click", async () => {
    const link = getInviteLink();
    if (!link) {
      setNetStatus("请先创建房间后再复制邀请链接");
      pushLobbyEvent("复制失败：尚未创建房间。");
      return;
    }
    try {
      await navigator.clipboard.writeText(link);
      setNetStatus("邀请链接已复制");
      pushLobbyEvent("已复制邀请链接。");
    } catch (_) {
      if (el.inviteLink) {
        el.inviteLink.focus();
        el.inviteLink.select();
      }
      setNetStatus("请手动复制邀请链接");
      pushLobbyEvent("自动复制失败，请手动复制。");
    }
  });
}
if (el.btnLobbyReady) {
  el.btnLobbyReady.addEventListener("click", () => {
    if (!(net.mode === "online" && net.connected)) return;
    setMyReady(!net.myReady);
  });
}

if (!loadDeckBuilderCache()) setDeckToDefault();
try {
  const roomFromUrl = (new URL(window.location.href)).searchParams.get("room");
  if (roomFromUrl) {
    if (el.joinRoomCode) el.joinRoomCode.value = roomFromUrl.toUpperCase();
    switchToOnlineMode();
    setPrepNotice("已从链接读取房间码，点击“加入房间”即可联机。", false);
    pushLobbyEvent(`已读取房间码：${roomFromUrl.toUpperCase()}`);
  }
} catch (_) {
  // Ignore URL parse errors.
}
setScreen("prep");
initBattleDrawers();
refreshNetUI();
updateLobbyBoard();
render();
logLine("请选择角色并开始战斗。模式：实时演算 + 抽牌 + 五行资源。" );
