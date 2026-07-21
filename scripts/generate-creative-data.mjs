import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { storyGenres } from './generate-story-data.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const defaultDataDir = path.join(root, 'data');
const split = (value) => value.split('|').map((item) => item.trim()).filter(Boolean);

const formModifiers = {
  person: split('若い|穏やかな|無口な|勇敢な|不器用な|陽気な|慎重な|頑固な|親切な|謎めいた'),
  noun: split('古い|新しい|小さな|大きな|静かな|鮮やかな|隠れた|失われた|特別な|不思議な'),
  action: split('ひそかに|急いで|丁寧に|思い切って|一人で|皆と|偶然に|繰り返し|最後に|初めて'),
  state: split('深い|小さな|消えない|意外な|隠された|揺るがない|一時の|新たな|長年の|言えない'),
  relation: split('かつての|現在の|秘密の|不安定な|対等な|一方的な|複雑な|切れない|変わりゆく|思わぬ'),
  title: split('失われた|最後の|小さな|青い|夜の|遠い|秘密の|静かな|新しい|忘れられた'),
};

function category(id, en, label, form, values) {
  const terms = split(values);
  if (terms.length !== 10) throw new Error(`${id}: expected 10 terms, got ${terms.length}`);
  if (!formModifiers[form]) throw new Error(`${id}: unknown form ${form}`);
  return { id, en, label, form, terms };
}

export const creativeMakers = [
  {
    id: 'character', label: 'キャラクターメーカー', shortLabel: 'キャラクター', en: 'CHARACTER MAKER', accent: '#8b5f9d',
    description: '性格、価値観、過去、秘密、葛藤、変化を組み合わせ、物語を動かす人物像を作ります。',
    categories: [
      category('archetype', 'Role', '立場', 'person', '学生|旅人|教師|料理人|職人|研究者|配達人|店員|保護者|年配者'),
      category('personality', 'Personality', '性格', 'state', '好奇心|慎重さ|陽気さ|頑固さ|思いやり|負けん気|冷静さ|寂しがり|正直さ|気まぐれ'),
      category('value', 'Value', '価値観', 'state', '家族第一|自由重視|約束厳守|平穏志向|挑戦精神|公平さ|伝統尊重|仲間意識|自立心|好奇心'),
      category('desire', 'Desire', '願い', 'action', '居場所を守る|真実を知る|家族に会う|自由を得る|約束を果たす|故郷へ帰る|腕を認められる|過去を忘れる|友を救う|日常を変える'),
      category('fear', 'Fear', '恐れ', 'state', '孤独への恐れ|失敗の記憶|別れの予感|暗所への恐怖|裏切りへの不安|変化への抵抗|注目への苦手意識|喪失の恐れ|責任への不安|秘密露見の恐怖'),
      category('strength', 'Strength', '長所', 'state', '観察力|行動力|忍耐力|共感力|決断力|記憶力|交渉力|創造力|集中力|包容力'),
      category('weakness', 'Weakness', '弱点', 'state', '早とちり|優柔不断|過信|頑固さ|人見知り|忘れ癖|短気|遠慮しすぎ|疑い深さ|抱え込み'),
      category('habit', 'Habit', '癖', 'action', '爪を触る|独り言を言う|時計を見る|髪を直す|鼻歌を歌う|メモを取る|遠回りする|物を数える|窓を開ける|深呼吸する'),
      category('speech', 'Speech', '口調', 'noun', '丁寧語|短い返事|早口|遠回しな話し方|素朴な言葉|強い断定|小声|冗談交じり|古風な言い回し|質問の多い話し方'),
      category('past', 'Past', '過去', 'title', '家族との別れ|初めての失敗|故郷の火事|友との約束|長い療養|秘密の旅|師との出会い|失われた記録|突然の転校|叶わなかった夢'),
      category('secret', 'Secret', '秘密', 'state', '本当の出自|隠した手紙|偽りの名前|消した記録|密かな借り|過去の目撃|言えない約束|失った記憶|二重の役目|知らない才能'),
      category('relation', 'Relation', '人間関係', 'relation', '家族との距離|旧友との絆|師弟関係|隣人との縁|宿敵との因縁|同僚との信頼|旅人との約束|親子の確執|仲間との連帯|恩人への借り'),
      category('conflict', 'Conflict', '葛藤', 'state', '自由と責任|愛情と嫉妬|正義と友情|夢と生活|真実と平穏|伝統と変化|信頼と疑念|勇気と恐怖|個人と集団|過去と未来'),
      category('change', 'Change', '変化', 'action', '他人を信じる|弱さを認める|故郷を離れる|責任を負う|秘密を話す|夢を選び直す|仲間を頼る|過去を許す|自分で決める|新生活を始める'),
    ],
  },
  {
    id: 'world', label: '世界観メーカー', shortLabel: '世界観', en: 'WORLD MAKER', accent: '#3d7d73',
    description: '地理、文化、制度、技術、信仰、禁忌、歴史、日常生活から舞台世界を設計します。',
    categories: [
      category('geography', 'Geography', '地理', 'noun', '海沿いの平野|高い山脈|深い森林|広い湿原|火山島|乾いた盆地|大河の流域|氷の海岸|浮かぶ台地|地下空洞'),
      category('climate', 'Climate', '気候', 'state', '長い雨季|短い夏|厳しい冬|乾いた風|濃い霧|激しい寒暖差|穏やかな春|頻繁な嵐|白夜の季節|終わらない夕暮れ'),
      category('settlement', 'Settlement', '集落', 'noun', '港町|城壁都市|山村|市場街|水上集落|地下都市|宿場町|研究都市|移動集落|国境の村'),
      category('culture', 'Culture', '文化', 'noun', '贈答文化|語り部の伝統|共同食堂|季節祭|仮面の儀礼|手仕事の習慣|歌による記録|家名制度|夜市の風習|旅人歓待'),
      category('government', 'Government', '統治', 'noun', '長老会|市民議会|王政|自治組合|地域評議会|官僚制度|持ち回り制|神官政治|商人連合|村落自治'),
      category('livelihood', 'Livelihood', '生業', 'noun', '農耕|漁業|採鉱|交易|織物作り|薬草採集|造船|牧畜|観測業|保存食作り'),
      category('technology', 'Technology', '技術', 'noun', '風力機械|水路網|蒸気装置|蓄光素材|精密時計|音声記録|空中輸送|自動人形|海中通信|植物発電'),
      category('belief', 'Belief', '信仰', 'state', '祖先崇拝|自然信仰|星への祈り|海への畏れ|火の儀礼|夢占い|巡礼の習慣|言葉の禁忌|季節神信仰|記憶の祭祀'),
      category('food', 'Food', '食文化', 'noun', '発酵料理|魚の保存食|根菜の煮込み|香草茶|平焼きパン|豆の料理|木の実菓子|燻製料理|海藻の汁物|祝祭の大皿'),
      category('transport', 'Transport', '交通', 'noun', '渡し舟|山岳鉄道|乗合馬車|帆走船|地下水路|滑空艇|徒歩街道|移動橋|荷運び動物|風を使う車'),
      category('law', 'Law', '法律', 'noun', '夜間外出規則|水の配給法|旅人登録制|共同労働義務|市場の交換規定|記録保存法|森林保護令|家名継承法|沈黙時間制度|地域相互扶助法'),
      category('taboo', 'Taboo', '禁忌', 'state', '本名を呼ぶこと|夜に笛を吹くこと|聖林へ入ること|食事を残すこと|古井戸をのぞくこと|青い花を摘むこと|祭りを欠席すること|鏡を贈ること|雨の日に旅立つこと|記録を燃やすこと'),
      category('history', 'History', '歴史', 'title', '大洪水|長い内乱|交易路の開通|王家の断絶|疫病の収束|都市の移転|鉱山の発見|大火からの再建|移民の到来|古い盟約'),
      category('daily_life', 'Daily Life', '日常生活', 'action', '朝市へ通う|共同井戸を使う|夕暮れに歌う|家族で食卓を囲む|道具を修理する|隣人と物を交換する|季節の服を縫う|広場で知らせを聞く|夜に記録を読む|週末に湯へ行く'),
    ],
  },
  {
    id: 'plot', label: 'プロットメーカー', shortLabel: 'プロット', en: 'PLOT MAKER', accent: '#b05c49',
    description: '導入、事件、転換点、危機、選択、決着、余韻まで物語の流れを組み立てます。',
    categories: [
      category('opening', 'Opening', '導入', 'title', '平凡な朝|旅立ち前夜|祭りの準備|長雨の町|静かな再会|新学期|閉店間際|船の到着|停電の夜|手紙の朝'),
      category('protagonist', 'Protagonist', '主人公', 'person', '学生|旅人|店員|教師|料理人|職人|配達人|研究者|保護者|年配者'),
      category('desire', 'Desire', '願い', 'action', '家族を守る|真実を知る|故郷へ帰る|約束を果たす|失物を見つける|腕を認められる|友を助ける|秘密を隠す|新生活を始める|自由を得る'),
      category('inciting', 'Incident', '発端事件', 'title', '突然の失踪|匿名の依頼|古い手紙|思わぬ再会|停電|記録の発見|事故の知らせ|うわさの拡大|期限付きの招待|見知らぬ訪問者'),
      category('first_choice', 'First Choice', '最初の選択', 'action', '依頼を受ける|町を出る|秘密を守る|友に相談する|証拠を隠す|危険地へ向かう|家族に話す|一人で調べる|約束を破る|助けを求める'),
      category('obstacle', 'Obstacle', '最初の障害', 'state', '時間不足|資金不足|悪天候|仲間割れ|通行止め|記憶違い|道具の故障|誤解|監視の目|情報不足'),
      category('ally', 'Ally', '協力者', 'person', '旧友|隣人|同級生|旅人|職人|図書館員|料理人|年配者|記者|配達人'),
      category('opponent', 'Opponent', '対立者', 'person', '競争相手|責任者|親族|指導者|商人|研究者|旧友|保護者|役人|匿名の人物'),
      category('midpoint', 'Midpoint', '中間転換', 'title', '正体の判明|目的の逆転|味方の離脱|期限の短縮|新証拠の発見|秘密の露見|場所の移動|約束の破綻|過去との再会|被害の拡大'),
      category('loss', 'Loss', '喪失', 'state', '大切な道具|仲間の信頼|帰る場所|残り時間|唯一の証拠|安全な道|記憶の一部|家族の理解|交渉の機会|自信'),
      category('revelation', 'Revelation', '真相', 'state', '隠された血縁|偽られた記録|味方の目的|事件の発端|主人公の記憶|敵の事情|過去の約束|失踪者の計画|町の秘密|誤解の原因'),
      category('final_choice', 'Final Choice', '最後の選択', 'action', '真実を公表する|仲間を信じる|故郷を捨てる|秘密を守り抜く|敵を助ける|約束を選ぶ|夢を諦める|責任を引き受ける|一人で残る|新しい道へ進む'),
      category('climax', 'Climax', '決着', 'title', '公開の対決|夜明けの救出|最後の交渉|嵐の中の帰還|皆の前での告白|記録の復元|競技の最終戦|祭りでの再会|閉ざされた扉の開放|静かな別れ'),
      category('aftermath', 'Aftermath', '余韻', 'title', '新しい日常|残された手紙|空いた席|受け継いだ道具|変わった町|再び交わす約束|遠くなる故郷|続く旅|小さな祝い|次の季節'),
    ],
  },
  {
    id: 'scene', label: 'シーンメーカー', shortLabel: 'シーン', en: 'SCENE MAKER', accent: '#47769b',
    description: '時間、場所、目的、感情、対立、行動、台詞、変化から一場面を具体化します。',
    categories: [
      category('time', 'Time', '時間', 'title', '夜明け|昼休み|夕暮れ|真夜中|雨上がり|祭り前|閉店間際|出発直前|休日の朝|長い待ち時間'),
      category('place', 'Place', '場所', 'noun', '駅のホーム|台所|屋上|図書館|港|商店街|教室|病室|森の小屋|古い劇場'),
      category('participants', 'People', '登場人物', 'relation', '親子二人|旧友同士|初対面の二人|師弟|兄弟姉妹|隣人同士|競争相手|旅人と案内人|店員と客|教師と学生'),
      category('goal', 'Goal', '場面の目的', 'action', '謝罪を伝える|秘密を聞き出す|別れを告げる|協力を頼む|誤解を解く|約束を確認する|証拠を渡す|本音を隠す|進路を決める|危険を知らせる'),
      category('tension', 'Tension', '対立', 'state', '意見の食い違い|隠された嫉妬|時間切れの不安|昔の恨み|立場の違い|言えない秘密|責任の押し付け|約束違反|信頼の揺らぎ|別れへの抵抗'),
      category('emotion', 'Emotion', '感情', 'state', '喜び|怒り|悲しみ|戸惑い|安心|焦り|嫉妬|期待|罪悪感|懐かしさ'),
      category('action', 'Action', '行動', 'action', '席を立つ|手紙を渡す|窓を開ける|目をそらす|飲み物を置く|扉を閉める|写真を見る|時計を確認する|相手に近づく|荷物を持つ'),
      category('dialogue', 'Dialogue', '中心台詞', 'title', '本当のこと|遅すぎた謝罪|短い返事|思わぬ質問|名前を呼ぶ声|初めての感謝|別れの言葉|守れない約束|隠していた本音|次の誘い'),
      category('interruption', 'Interruption', '割り込み', 'title', '突然の電話|停電|第三者の登場|大きな物音|雨の降り出し|発車の合図|警報|落とし物|予定外の知らせ|子どもの質問'),
      category('object', 'Object', '小道具', 'noun', '古い写真|折れた鍵|手紙|冷めた飲み物|腕時計|濡れた傘|小さな箱|地図|片方の手袋|録音機'),
      category('sensory', 'Sense', '感覚描写', 'state', '雨の匂い|木のきしみ|遠い音楽|冷たい風|湯気の温度|眩しい光|ざらつく紙|潮の香り|静かな足音|時計の音'),
      category('reveal', 'Reveal', '判明すること', 'state', '本当の目的|隠された関係|過去の約束|持ち主の正体|誤解の原因|出発の理由|嘘の一部|失物の場所|相手の決意|残り時間'),
      category('change', 'Change', '場面後の変化', 'action', '信頼を取り戻す|関係を断つ|同行を決める|秘密を共有する|約束を結び直す|一人で進む|相手を疑う|家へ帰る|計画を変える|助けを求める'),
      category('exit', 'Exit', '退場', 'action', '振り返らず去る|手を振って別れる|次の場所へ急ぐ|一人で残る|相手を見送る|扉を開けて出る|雨の中へ進む|笑って帰る|何も言わず離れる|約束して別れる'),
    ],
  },
  {
    id: 'relationship', label: '関係性メーカー', shortLabel: '関係性', en: 'RELATIONSHIP MAKER', accent: '#a45f72',
    description: '二人の出会い、共通点、対立、秘密、距離の変化、最終関係を組み立てます。',
    categories: [
      category('person_a', 'Person A', '人物A', 'person', '学生|旅人|教師|料理人|職人|研究者|店員|配達人|保護者|年配者'),
      category('person_b', 'Person B', '人物B', 'person', '同級生|隣人|旧友|案内人|競争相手|親族|同僚|客|弟子|恩人'),
      category('meeting', 'Meeting', '出会い', 'title', '雨宿り|落とし物|共同作業|道案内|席の取り違え|小さな事故|旅先の食堂|祭りの準備|図書館の貸出|友人の紹介'),
      category('bond', 'Bond', 'つながり', 'relation', '同じ故郷|共通の友人|古い約束|家族の縁|仕事上の協力|同じ秘密|旅の同行|師弟の縁|競技仲間|隣人関係'),
      category('commonality', 'Common', '共通点', 'state', '音楽好き|負けず嫌い|家族思い|朝型|読書好き|方向音痴|料理好き|心配性|旅好き|動物好き'),
      category('difference', 'Difference', '相違点', 'state', '年齢差|身分差|価値観の違い|生活時間の違い|故郷の違い|経験差|将来像の違い|責任の差|話し方の違い|秘密の有無'),
      category('distance', 'Distance', '初期距離', 'state', '強い警戒|一方的な憧れ|気軽な親しさ|長年の疎遠|表面上の礼儀|競争心|依存|無関心|尊敬|苦手意識'),
      category('trust', 'Trust', '信頼の理由', 'title', '守られた約束|危機での救助|正直な告白|共同の成功|黙っていた配慮|失敗の共有|家族への優しさ|長い同行|秘密の保護|公平な判断'),
      category('misunderstanding', 'Misread', '誤解', 'state', '遅れた返事|見間違い|伝言の不足|隠した事情|偶然の目撃|冗談の失敗|約束の日違い|第三者のうわさ|似た持ち物|沈黙の意味'),
      category('secret', 'Secret', '共有秘密', 'state', '本当の名前|過去の失敗|家族の事情|隠した手紙|将来の計画|失物の行方|事件の目撃|密かな借り|叶わない願い|別れの予定'),
      category('debt', 'Debt', '貸し借り', 'relation', '命の恩|金銭の借り|道具の貸し|約束の借り|情報の交換|住まいの提供|仕事の紹介|家族への支援|秘密の保護|失敗の肩代わり'),
      category('turning', 'Turning', '転換点', 'title', '初めての衝突|突然の別れ|共同の危機|秘密の露見|役割の逆転|家族との対面|旅の終わり|約束の期限|第三者の介入|思わぬ再会'),
      category('choice', 'Choice', '関係の選択', 'action', '相手を信じる|距離を置く|秘密を話す|一緒に旅立つ|競争をやめる|約束を破る|家族に紹介する|助けを断る|謝罪を受け入れる|別れを選ぶ'),
      category('outcome', 'Outcome', '最終関係', 'relation', '親友|家族同然|良き競争相手|疎遠な知人|旅の仲間|師弟|仕事仲間|互いの恩人|秘密の共有者|別々の道を行く二人'),
    ],
  },
  {
    id: 'dialogue', label: '台詞・会話メーカー', shortLabel: '台詞・会話', en: 'DIALOGUE MAKER', accent: '#6b739f',
    description: '話者、相手、話題、本音、建前、口調、沈黙、転換台詞から会話の芯を作ります。',
    categories: [
      category('speaker', 'Speaker', '話者', 'person', '学生|旅人|教師|料理人|職人|研究者|店員|配達人|保護者|年配者'),
      category('listener', 'Listener', '相手', 'person', '同級生|隣人|旧友|案内人|競争相手|親族|同僚|客|弟子|恩人'),
      category('setting', 'Setting', '会話場所', 'noun', '台所|駅のホーム|教室|屋上|病室|港|図書館|商店|森の小屋|車内'),
      category('topic', 'Topic', '話題', 'noun', '進路|家族|失物|約束|旅行|仕事|秘密|引っ越し|事件|別れ'),
      category('surface', 'Surface', '表向きの目的', 'action', '予定を確認する|道を尋ねる|近況を話す|品物を返す|食事に誘う|礼を伝える|助言を求める|うわさを確かめる|謝罪する|別れを告げる'),
      category('intent', 'Intent', '本音', 'action', '引き留める|秘密を知る|許しを得る|好意を伝える|責任を逃れる|相手を試す|助けを求める|別れを避ける|約束させる|真実を隠す'),
      category('mood', 'Mood', '感情', 'state', '緊張|安心|怒り|悲しみ|期待|嫉妬|戸惑い|懐かしさ|罪悪感|喜び'),
      category('tone', 'Tone', '口調', 'noun', '丁寧な口調|早口|小声|冗談交じり|冷たい言い方|遠回しな表現|強い断定|素朴な言葉|古風な話し方|質問の多い口調'),
      category('opening', 'Opening', '会話の始まり', 'title', '久しぶり|少し時間ある|聞きたいこと|今日は寒い|その荷物は何|覚えているか|遅くなった|話が違う|手紙を読んだ|帰るのか'),
      category('evasion', 'Evasion', 'はぐらかし', 'action', '天気の話に変える|質問で返す|笑ってごまかす|沈黙する|時計を見る|相手を褒める|昔話を始める|飲み物を勧める|聞こえないふりをする|急用を思い出す'),
      category('question', 'Question', '核心の質問', 'title', '誰を守りたい|なぜ黙っていた|本当に帰るのか|あの日何を見た|私を信じるか|約束を覚えているか|何を恐れている|誰から聞いた|まだ間に合うか|一緒に来るか'),
      category('silence', 'Silence', '沈黙', 'state', '短い間|長い沈黙|目をそらす時間|返事を待つ間|言葉を探す時間|怒りを抑える間|涙を隠す間|周囲を気にする間|決心する時間|別れを悟る間'),
      category('turning_line', 'Turn Line', '転換台詞', 'title', '本当は違う|全部知っている|もう時間がない|君のせいではない|私がやった|一緒に行こう|約束は終わりだ|まだ信じている|帰る場所はある|これが最後だ'),
      category('aftermath', 'Aftermath', '会話後', 'action', '握手する|別々に帰る|一緒に歩く|手紙を渡す|約束を結ぶ|連絡を断つ|秘密を共有する|相手を見送る|計画を変える|何も言わず残る'),
    ],
  },
  {
    id: 'mystery', label: '事件・謎メーカー', shortLabel: '事件・謎', en: 'MYSTERY MAKER', accent: '#596b62',
    description: '事件、被害、手掛かり、容疑者、動機、偽情報、矛盾、真相、解決を設計します。',
    categories: [
      category('incident', 'Incident', '事件', 'title', '品物の消失|突然の失踪|記録の改ざん|密室の破損|匿名の脅迫|展示品の交換|届かない手紙|不審な停電|予定外の事故|偽名の使用'),
      category('victim', 'Victim', '被害対象', 'noun', '店主|学生|旅人|研究者|家族|地域住民|職人|配達人|図書館員|競技参加者'),
      category('scene', 'Scene', '現場', 'noun', '台所|倉庫|図書館|駅|港|教室|劇場|研究室|市場|山小屋'),
      category('missing', 'Missing', '失われた物', 'noun', '古い写真|手紙|鍵|地図|記録帳|指輪|試作品|売上金|薬瓶|録音機'),
      category('clue', 'Clue', '手掛かり', 'noun', '濡れた足跡|破れた紙|時計のずれ|違う筆跡|土の付いた靴|消えた灯り|残った香り|逆向きの鍵|短い録音|空の封筒'),
      category('witness', 'Witness', '目撃者', 'person', '隣人|店員|子ども|旅人|警備員|配達人|教師|清掃員|同級生|年配者'),
      category('suspect', 'Suspect', '容疑者', 'person', '親族|競争相手|元同僚|常連客|責任者|研究仲間|旧友|旅人|隣人|匿名の依頼人'),
      category('motive', 'Motive', '動機', 'state', '金銭欲|嫉妬|復讐心|秘密保護|家族愛|名誉欲|恐怖|誤解|事故隠し|約束の履行'),
      category('alibi', 'Alibi', 'アリバイ', 'title', '映画館の半券|駅の記録|家族の証言|店の領収書|通話履歴|雨で濡れた服|配達記録|写真の時刻|競技の映像|宿泊者名簿'),
      category('false_clue', 'False Clue', '偽手掛かり', 'noun', '置かれた手袋|偽造した手紙|借りた傘|別人の足跡|止めた時計|加工した写真|古い領収書|似た鍵|匿名のうわさ|入れ替えた荷物'),
      category('hidden_link', 'Hidden Link', '隠れた関係', 'relation', '親子関係|旧友の縁|過去の同僚|師弟関係|金銭の貸し借り|秘密の婚約|同郷の縁|共同研究|家族ぐるみの交流|昔の競争相手'),
      category('contradiction', 'Conflict', '矛盾', 'state', '時刻の食い違い|天候との不一致|証言の順序違い|利き手の違い|移動時間の不足|鍵の向き|服装の記憶違い|音の聞こえ方|荷物の重さ|写真の影'),
      category('truth', 'Truth', '真相', 'title', '事故の隠蔽|善意の持ち出し|身代わり|記憶違い|二重の依頼|自作自演|誤配|家族の保護|偽名による避難|過去の約束'),
      category('resolution', 'Resolution', '解決方法', 'action', '証言を並べ直す|時刻表を確認する|現場を再現する|筆跡を比べる|持ち物を調べる|関係者を集める|写真を拡大する|移動経路を歩く|録音を聞き直す|本人に問いかける'),
    ],
  },
  {
    id: 'title', label: 'タイトルメーカー', shortLabel: 'タイトル', en: 'TITLE MAKER', accent: '#9b6d35', resultMode: 'titles',
    description: '題材、人物、場所、時間、色、天気、物、感情、象徴語を組み合わせて題名候補を作ります。',
    categories: [
      category('subject', 'Subject', '題材', 'title', '約束|旅|家族|友情|秘密|記憶|食卓|祭り|手紙|帰郷'),
      category('person', 'Person', '人物', 'person', '旅人|学生|教師|料理人|職人|研究者|配達人|店員|子ども|年配者'),
      category('place', 'Place', '場所', 'title', '港町|図書館|屋上|商店街|山村|駅|食堂|劇場|島|研究所'),
      category('time', 'Time', '時間', 'title', '夜明け|夕暮れ|真夜中|春|夏|秋|冬|休日|祭り前夜|最後の日'),
      category('color', 'Color', '色', 'title', '赤|青|白|黒|金色|銀色|琥珀色|空色|深緑|薄紅'),
      category('weather', 'Weather', '天気', 'title', '雨|雪|霧|風|嵐|晴天|夕立|初雪|長雨|春風'),
      category('object', 'Object', '物', 'title', '古い手紙|小さな鍵|家族写真|止まった時計|雨傘|旅の地図|片道切符|銀の指輪|革の手帳|木の小箱'),
      category('action', 'Action', '動き', 'title', '帰る|待つ|探す|歩く|眠る|歌う|忘れる|出会う|別れる|見つける'),
      category('emotion', 'Emotion', '感情', 'title', '喜び|悲しみ|怒り|不安|期待|後悔|安心|嫉妬|希望|懐かしさ'),
      category('contrast', 'Contrast', '対比', 'title', '光と影|朝と夜|嘘と真実|出会いと別れ|記憶と忘却|自由と責任|町と海|過去と未来|家族と孤独|声と沈黙'),
      category('number', 'Number', '数', 'title', '一つ|二人|三日|四季|五分|六通|七つ|八年|九回|十歩'),
      category('sound', 'Sound', '音', 'title', '鐘の音|足音|雨音|汽笛|歌声|ささやき|時計の音|波音|拍手|沈黙'),
      category('symbol', 'Symbol', '象徴', 'title', '扉|橋|窓|道|灯り|種|鳥|星|海|木'),
      category('ending_word', 'Ending', '結びの語', 'title', '物語|記録|約束|季節|地図|手紙|帰り道|食卓|旅|朝'),
    ],
  },
];

function buildFormats(categories) {
  const ids = categories.map(({ id }) => id);
  return [
    { id: 'core', name: '基本構成', description: '中心となる6要素を組み合わせます。', categories: ids.slice(0, 6) },
    { id: 'focused', name: '発展構成', description: '8要素で人物や状況を一段深めます。', categories: ids.slice(0, 8) },
    { id: 'detailed', name: '詳細構成', description: '10要素で具体的な案へ広げます。', categories: ids.slice(0, 10) },
    { id: 'full', name: 'フル構成', description: '収録した14要素をすべて使います。', categories: ids },
  ];
}

function buildItems(maker, definition) {
  const modifiers = formModifiers[definition.form];
  const bases = modifiers.flatMap((modifier) => definition.terms.map((term) => `${modifier}${term}`));
  return storyGenres.flatMap((genre) => bases.map((base) => ({
    text: `${genre.prefix}${base}`,
    genre: genre.id,
    ...(maker.resultMode === 'titles' ? { base } : {}),
  })));
}

export async function writeCreativeData(dataDir = defaultDataDir) {
  const makersDir = path.join(dataDir, 'makers');
  await mkdir(makersDir, { recursive: true });
  const publicMakers = [];

  for (const maker of creativeMakers) {
    const makerDir = path.join(makersDir, maker.id);
    await mkdir(makerDir, { recursive: true });
    for (const definition of maker.categories) {
      const items = buildItems(maker, definition);
      if (items.length !== 3000) throw new Error(`${maker.id}/${definition.id}: expected 3000 values, got ${items.length}`);
      if (new Set(items.map(({ text }) => text.normalize('NFKC'))).size !== items.length) {
        throw new Error(`${maker.id}/${definition.id}: duplicate values detected`);
      }
      const tooLong = items.find(({ text }) => [...text].length > 20);
      if (tooLong) throw new Error(`${maker.id}/${definition.id}: exceeds 20 characters (${[...tooLong.text].length}): ${tooLong.text}`);
      await writeFile(path.join(makerDir, `${definition.id}.json`), `${JSON.stringify(items, null, 2)}\n`, 'utf8');
    }
    publicMakers.push({
      id: maker.id,
      label: maker.label,
      shortLabel: maker.shortLabel,
      en: maker.en,
      accent: maker.accent,
      description: maker.description,
      resultMode: maker.resultMode || 'memo',
      categories: maker.categories.map(({ id, en, label }) => ({ id, en, label })),
      formats: buildFormats(maker.categories),
    });
    console.log(`maker/${maker.id}: ${maker.categories.length} categories x 3000`);
  }

  await writeFile(path.join(dataDir, 'makers.json'), `${JSON.stringify(publicMakers, null, 2)}\n`, 'utf8');
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedPath === path.resolve(fileURLToPath(import.meta.url))) await writeCreativeData();
