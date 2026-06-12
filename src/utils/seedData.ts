import { Artwork, Inspection, Maintenance, Comment, Photo, Volunteer, UserPhoto } from '../db';
import { ArtworkType, InspectionStatus } from '../types';
import { artworkRepo, inspectionRepo, maintenanceRepo, commentRepo, photoRepo, userPhotoRepo, volunteerRepo } from '../../db';

/**
 * 生成一个随机图片占位URL（使用 picsum 风格的随机图服务）
 */
function randomImage(seed: number, w = 600, h = 400): string {
  return `https://picsum.photos/seed/art${seed}/${w}/${h}`;
}

/**
 * 生成艺术品种子数据
 */
const artworkSeeds: Omit<Artwork, 'id' | 'createdAt' | 'updatedAt' | 'viewCount' | 'inspectionCount'>[] = [
  {
    name: '城市晨曦',
    type: ArtworkType.SCULPTURE,
    year: 2020,
    material: '青铜',
    district: '东城区',
    address: '东长安街12号文化广场',
    artist: '李明远',
    description: '一座展现城市清晨苏醒瞬间的现代抽象雕塑，青铜铸造，高6.2米。',
    statusLatest: InspectionStatus.GOOD,
    lat: 39.9142,
    lng: 116.4234,
    ownership: '东城区文化委员会',
    fundingSource: '政府公共艺术专项基金',
    story: '作品创作于2019年末，灵感源自艺术家在北京城东郊的一次清晨漫步，捕捉到了第一缕阳光穿透薄雾的动人瞬间。雕塑整体采用流线型设计，象征着城市发展的蓬勃生机。',
    publicFeedback: '该作品自落成以来，已成为市民晨练、拍照打卡的热门地点，多次被社交媒体推荐为城市必访公共艺术景点。'
  },
  {
    name: '岁月长河',
    type: ArtworkType.MURAL,
    year: 2018,
    material: '陶瓷',
    district: '西城区',
    address: '西单北大街88号文化中心外墙',
    artist: '王艺术、陈画匠（联合创作）',
    description: '长30米、高8米的巨型陶瓷马赛克壁画，记录了西城区百年变迁历程。',
    statusLatest: InspectionStatus.MINOR,
    lat: 39.9102,
    lng: 116.3729,
    ownership: '西城区文化和旅游局',
    fundingSource: '区财政+企业赞助',
    story: '壁画由20余位工艺美术大师历时两年共同完成，融合了中国传统工笔画与现代艺术表现手法，涵盖了从清末民初到当代的西城标志性建筑和人文景观。',
    publicFeedback: '壁画前常年有市民驻足观赏，已成为外地游客了解北京历史文化的重要窗口。'
  },
  {
    name: '光之矩阵',
    type: ArtworkType.INSTALLATION,
    year: 2022,
    material: '不锈钢',
    district: '朝阳区',
    address: '朝阳公园南门艺术区',
    artist: '张光熠',
    description: '由365根LED光柱组成的互动式灯光装置，高度从2米到8米不等。',
    statusLatest: InspectionStatus.GOOD,
    lat: 39.9357,
    lng: 116.4789,
    ownership: '朝阳公园管理处',
    fundingSource: '文旅部艺术科技项目',
    story: '装置内置人体感应传感器，观众靠近时光柱会以不同频率闪烁变化，象征着每个人都是城市之光的组成部分。夜晚效果尤为震撼。',
    publicFeedback: '夜晚吸引大量年轻观众前往体验，被评为2022年度最受市民欢迎的公共艺术装置。'
  },
  {
    name: '九龙献瑞',
    type: ArtworkType.FOUNTAIN,
    year: 2015,
    material: '花岗岩',
    district: '海淀区',
    address: '中关村广场中心',
    artist: '赵石雕',
    description: '直径12米的大型喷泉雕塑，九条巨龙环绕中心龙珠雕刻而成。',
    statusLatest: InspectionStatus.MODERATE,
    lat: 39.9812,
    lng: 116.3167,
    ownership: '中关村科技园管委会',
    fundingSource: '园区企业联合捐赠',
    story: '喷泉雕塑融合了中国传统龙文化与现代水景技术，九条龙造型各异，喷水角度经过精确计算，形成壮观的水幕效果。',
    publicFeedback: '夏季是周边上班族和居民消暑纳凉的好去处，孩子们尤其喜欢在喷泉周围嬉戏。'
  },
  {
    name: '人民英雄永垂不朽',
    type: ArtworkType.MONUMENT,
    year: 2008,
    material: '大理石',
    district: '丰台区',
    address: '丰台抗战纪念馆广场',
    artist: '集体创作',
    description: '高15米的汉白玉纪念碑，正面镌刻革命历史浮雕。',
    statusLatest: InspectionStatus.GOOD,
    lat: 39.8521,
    lng: 116.2795,
    ownership: '丰台区退役军人事务局',
    fundingSource: '国家重点文物保护专项',
    story: '纪念碑于2008年北京奥运会前夕落成，铭记了为民族解放事业英勇献身的革命先烈，是重要的爱国主义教育基地。',
    publicFeedback: '每年清明节、抗战胜利纪念日等重要节点，都会举办大型纪念活动，社会各界人士前来瞻仰敬献花篮。'
  },
  {
    name: '未来畅想曲',
    type: ArtworkType.GRAFFITI,
    year: 2023,
    material: '马赛克',
    district: '朝阳区',
    address: '798艺术区D区2号墙',
    artist: '街头涂鸦团体「喷绘世代」',
    description: '面积80平方米的大型街头涂鸦作品，主题为科技与艺术的融合。',
    statusLatest: InspectionStatus.GOOD,
    lat: 39.9846,
    lng: 116.4962,
    ownership: '798艺术区运营公司',
    fundingSource: '青年艺术家扶持计划',
    story: '作品由5位平均年龄不到25岁的年轻艺术家共同完成，用色大胆鲜艳，结合了赛博朋克与中国元素，表达了对未来城市生活的美好憧憬。',
    publicFeedback: '是798艺术区最受欢迎的打卡墙之一，周末经常排起长队等待拍照。'
  },
  {
    name: '时空对话',
    type: ArtworkType.SCULPTURE,
    year: 2019,
    material: '不锈钢',
    district: '东城区',
    address: '国家博物馆前广场西侧',
    artist: '刘现代',
    description: '两座隔空相对的人物雕像，一古一今，形成跨越时空的对话感。',
    statusLatest: InspectionStatus.GOOD,
    lat: 39.9053,
    lng: 116.4012,
    ownership: '国家博物馆',
    fundingSource: '国家艺术基金',
    story: '作品以「历史与现代的对话」为主题，古人手持竹简，今人手持平板，形象地展现了中华文明的传承与发展。',
    publicFeedback: '因其独特的造型设计和深刻的文化内涵，成为游客参观国家博物馆前后必合影的景点。'
  },
  {
    name: '四季花坛',
    type: ArtworkType.MURAL,
    year: 2021,
    material: '陶瓷',
    district: '海淀区',
    address: '颐和园路东口过街天桥',
    artist: '清华美院壁画系师生',
    description: '天桥两侧共4幅巨型瓷板画，分别描绘春夏秋冬四季景色。',
    statusLatest: InspectionStatus.MINOR,
    lat: 39.9988,
    lng: 116.2923,
    ownership: '海淀区交通委',
    fundingSource: '城市微更新项目',
    story: '为响应城市美化号召，清华美院20余名师生利用暑期两个月时间，在原本单调的灰色天桥墙壁上创作了这组充满生机的四季主题壁画。',
    publicFeedback: '让原本乏味的过街天桥变成了一条艺术长廊，过往市民纷纷点赞。'
  },
  {
    name: '声音花园',
    type: ArtworkType.INSTALLATION,
    year: 2021,
    material: '青铜',
    district: '西城区',
    address: '什刹海荷花市场',
    artist: '周声音',
    description: '一组能够随风发出悦耳声响的金属风铃装置，共108件。',
    statusLatest: InspectionStatus.SEVERE,
    lat: 39.9402,
    lng: 116.3845,
    ownership: '什刹海风景区管理处',
    fundingSource: '文化创意产业基金',
    story: '每件风铃的音高都经过严格调校，组合起来可以演奏出中国传统五声音阶的旋律，风声即乐声，是一场与自然的合作演出。',
    publicFeedback: '春夏季微风拂过时，风铃奏出的悠扬声响令人心旷神怡，是什刹海景区的一大特色体验。'
  },
  {
    name: '水滴石穿',
    type: ArtworkType.FOUNTAIN,
    year: 2017,
    material: '不锈钢',
    district: '朝阳区',
    address: '望京SOHO中央庭院',
    artist: '孙水景',
    description: '以「水滴石穿」为意象的现代简约风格水景装置。',
    statusLatest: InspectionStatus.GOOD,
    lat: 39.9948,
    lng: 116.4783,
    ownership: 'SOHO中国物业',
    fundingSource: '开发商配套公建',
    story: '设计师以中国成语「水滴石穿」为灵感，用现代工业材料再现了这一自然现象的美感，象征着坚韧不拔的创业精神。',
    publicFeedback: '是望京上班族午休时最喜欢的放松地点之一。'
  },
  {
    name: '和平鸽群',
    type: ArtworkType.SCULPTURE,
    year: 2012,
    material: '青铜',
    district: '丰台区',
    address: '宛平城抗战纪念园',
    artist: '吴和平',
    description: '26只形态各异的和平鸽展翅飞翔的青铜雕塑群。',
    statusLatest: InspectionStatus.GOOD,
    lat: 39.8498,
    lng: 116.2295,
    ownership: '中国人民抗日战争纪念馆',
    fundingSource: '爱国主义教育基地建设',
    story: '每一只和平鸽都有独立的编号和独特造型，象征着对和平的珍视与向往，与抗战纪念园的历史氛围形成鲜明对比和精神升华。',
    publicFeedback: '参观者纷纷表示在庄严肃穆的纪念园中看到这组和平鸽雕塑，既令人动容又充满希望。'
  },
  {
    name: '汉字之美',
    type: ArtworkType.GRAFFITI,
    year: 2022,
    material: '混凝土',
    district: '东城区',
    address: '南锣鼓巷黑芝麻胡同15号院外墙',
    artist: '「字在」创作小组',
    description: '以中国汉字演变史为主题的涂鸦长卷，甲骨文→金文→小篆→隶书→楷书→行书各体皆备。',
    statusLatest: InspectionStatus.GOOD,
    lat: 39.9365,
    lng: 116.4038,
    ownership: '东城区交道口街道',
    fundingSource: '胡同文化创意项目',
    story: '为了让老胡同焕发新活力，街道邀请本地青年艺术家结合胡同文化特色，创作了这幅以汉字发展历程为主题的涂鸦作品，深受居民和游客喜爱。',
    publicFeedback: '许多家长特意带孩子前来观赏，寓教于乐地学习汉字文化。'
  },
  {
    name: '大地丰碑',
    type: ArtworkType.MONUMENT,
    year: 2005,
    material: '花岗岩',
    district: '海淀区',
    address: '清华大学百年校庆纪念广场',
    artist: '集体创作',
    description: '长24米的花岗岩石碑群，镌刻清华大学百年校史。',
    statusLatest: InspectionStatus.GOOD,
    lat: 40.0000,
    lng: 116.3264,
    ownership: '清华大学',
    fundingSource: '百年校庆专项+校友捐赠',
    story: '为纪念清华大学建校100周年而建，石碑正面刻有「自强不息 厚德载物」校训，背面记叙了百年清华与国家民族共命运的发展历程。',
    publicFeedback: '是清华校友返校必到的合影留念地点，也是新生入学教育的重要场所。'
  },
  {
    name: '都市音符',
    type: ArtworkType.INSTALLATION,
    year: 2020,
    material: '玻璃纤维',
    district: '朝阳区',
    address: '三里屯太古里北区广场',
    artist: '郑音律',
    description: '高达7米的彩色音符造型装置，内置音乐播放设备。',
    statusLatest: InspectionStatus.GOOD,
    lat: 39.9378,
    lng: 116.4531,
    ownership: '三里屯太古里',
    fundingSource: '商业美陈预算',
    story: '装置会定时播放由本地音乐人创作的城市主题音乐，观众也可以通过扫码点播歌曲，将公共空间变成一个开放的音乐厅。',
    publicFeedback: '年轻人们非常喜欢在装置前自拍视频分享到社交媒体，成为了三里屯的又一网红地标。'
  },
  {
    name: '运河记忆',
    type: ArtworkType.MURAL,
    year: 2019,
    material: '陶瓷',
    district: '丰台区',
    address: '丽泽金融商务区地下通道',
    artist: '北京画院',
    description: '长50米的陶瓷壁画，重现京杭大运河漕运盛景。',
    statusLatest: InspectionStatus.GOOD,
    lat: 39.8679,
    lng: 116.3210,
    ownership: '丽泽商务区管委会',
    fundingSource: '商务区公共艺术配套',
    story: '以清代《潞河督运图》为蓝本，结合现代壁画艺术语言，生动再现了作为南北交通大动脉的京杭大运河千帆竞渡、商贾云集的繁华景象。',
    publicFeedback: '让每天穿行地下通道的上班族们在匆忙脚步中也能感受到历史文化的熏陶。'
  }
];

/**
 * 生成志愿者种子数据
 */
const volunteerSeeds: Omit<Volunteer, 'id'>[] = [
  { name: '张伟', inspectionCount: 42, phone: '138****1234', email: 'zhangwei@example.com', joinDate: '2022-03-15T00:00:00.000Z' },
  { name: '李娜', inspectionCount: 38, phone: '139****5678', email: 'lina@example.com', joinDate: '2022-05-20T00:00:00.000Z' },
  { name: '王芳', inspectionCount: 35, phone: '136****9012', email: 'wangfang@example.com', joinDate: '2022-06-01T00:00:00.000Z' },
  { name: '刘洋', inspectionCount: 28, phone: '137****3456', email: 'liuyang@example.com', joinDate: '2022-08-10T00:00:00.000Z' },
  { name: '陈静', inspectionCount: 23, phone: '135****7890', email: 'chenjing@example.com', joinDate: '2023-01-05T00:00:00.000Z' },
  { name: '杨帆', inspectionCount: 18, phone: '133****2345', email: 'yangfan@example.com', joinDate: '2023-03-12T00:00:00.000Z' },
  { name: '赵敏', inspectionCount: 15, phone: '131****6789', email: 'zhaomin@example.com', joinDate: '2023-06-18T00:00:00.000Z' },
  { name: '孙磊', inspectionCount: 10, phone: '132****0123', email: 'sunlei@example.com', joinDate: '2023-09-25T00:00:00.000Z' }
];

/**
 * 生成巡查记录种子数据
 */
function generateInspectionSeeds(artworkIds: number[]): Omit<Inspection, 'id'>[] {
  const volunteers = ['张伟', '李娜', '王芳', '刘洋', '陈静', '杨帆', '赵敏', '孙磊'];
  const statuses = [InspectionStatus.GOOD, InspectionStatus.MINOR, InspectionStatus.MODERATE, InspectionStatus.SEVERE];
  const allIssues = ['涂鸦覆盖', '金属锈蚀', '结构松动', '石材风化', '植被侵入', '灯具损坏', '基座破损'];
  const records: Omit<Inspection, 'id'>[] = [];
  
  artworkIds.forEach((artworkId, idx) => {
    const recordCount = 2 + (idx % 4);
    for (let i = 0; i < recordCount; i++) {
      const date = new Date(2024, Math.max(0, idx - i - 1), (i + 3) * 5 + 1);
      const issues: string[] = [];
      const status = statuses[Math.min(Math.floor(idx / 4) + i, 3)];
      if (status !== InspectionStatus.GOOD && Math.random() > 0.3) {
        const issueCount = 1 + Math.floor(Math.random() * 2);
        for (let j = 0; j < issueCount; j++) {
          const issue = allIssues[Math.floor(Math.random() * allIssues.length)];
          if (!issues.includes(issue)) issues.push(issue);
        }
      }
      records.push({
        artworkId,
        date: date.toISOString(),
        status,
        volunteer: volunteers[(idx + i) % volunteers.length],
        issues: issues.join('、'),
        notes: status === InspectionStatus.GOOD 
          ? '作品保存状况良好，无明显损坏，继续保持。' 
          : `发现${issues.join('、')}等问题，已登记，建议${status === InspectionStatus.SEVERE ? '紧急' : status === InspectionStatus.MODERATE ? '尽快' : '择期'}处理。`,
        photos: [randomImage(artworkId * 100 + i, 400, 300)]
      });
    }
  });
  return records;
}

/**
 * 生成维护记录种子数据
 */
function generateMaintenanceSeeds(artworkIds: number[]): Omit<Maintenance, 'id'>[] {
  const contractors = ['城市艺术维护工程有限公司', '文博修复中心', '古建筑园林工程队', '现代雕塑修复工作室'];
  const workTypes = ['日常维护', '修复工程', '翻新改造', '紧急抢修'];
  const records: Omit<Maintenance, 'id'>[] = [];
  
  artworkIds.forEach((artworkId, idx) => {
    if (idx % 3 === 0) {
      const recordCount = 1 + (idx % 2);
      for (let i = 0; i < recordCount; i++) {
        const date = new Date(2024, idx % 6, (i + 1) * 8);
        const cost = 3000 + idx * 800 + i * 2000;
        records.push({
          artworkId,
          date: date.toISOString(),
          contractor: contractors[(idx + i) % contractors.length],
          workType: workTypes[idx % workTypes.length],
          cost,
          description: `${workTypes[idx % workTypes.length]}：对作品进行全面检查与维护，处理发现的问题，清洁作品表面，确保长期保存完好。`,
          completed: true,
          beforePhotos: [randomImage(artworkId * 200 + i, 400, 300)],
          afterPhotos: [randomImage(artworkId * 300 + i, 400, 300)]
        });
      }
    }
  });
  return records;
}

/**
 * 生成评论种子数据
 */
function generateCommentSeeds(artworkIds: number[]): Omit<Comment, 'id'>[] {
  const authors = ['艺术爱好者', '市民小王', '摄影师老李', '退休教师张阿姨', '游客Amanda', '大学生小陈', '文化观察员', '建筑师刘工'];
  const commentsText = [
    '这件作品太棒了，每次经过都忍不住多看几眼！',
    '设计很有创意，材质的质感表现得淋漓尽致。',
    '希望能有更多这样的公共艺术作品点缀城市空间。',
    '带孩子来欣赏，从小培养审美，很有意义。',
    '建议周围可以增加一些座椅，方便大家慢慢欣赏。',
    '夜晚灯光效果下更显魅力，强烈推荐夜间参观！',
    '作品背后的故事很感人，了解后更加喜欢了。',
    '城市就应该有这样的文化氛围，点赞！'
  ];
  const records: Omit<Comment, 'id'>[] = [];
  
  artworkIds.forEach((artworkId, idx) => {
    const commentCount = 2 + (idx % 5);
    for (let i = 0; i < commentCount; i++) {
      const date = new Date(2024, Math.max(0, (idx - i) % 11), (i + 5) * 3);
      records.push({
        artworkId,
        date: date.toISOString(),
        author: authors[(idx + i) % authors.length],
        rating: 4 + (i % 2),
        content: commentsText[(idx + i) % commentsText.length],
        photos: i % 3 === 0 ? [randomImage(artworkId * 400 + i, 500, 375)] : []
      });
    }
  });
  return records;
}

/**
 * 生成官方照片种子数据
 */
function generatePhotoSeeds(artworkIds: number[]): Omit<Photo, 'id'>[] {
  const categories = ['全景', '局部细节', '铭牌特写', '创作现场'];
  const records: Omit<Photo, 'id'>[] = [];
  
  artworkIds.forEach((artworkId, idx) => {
    categories.forEach((cat, catIdx) => {
      const date = new Date(2023, 10, idx + catIdx + 1);
      records.push({
        artworkId,
        category: cat,
        url: randomImage(artworkId * 500 + catIdx, 800, 600),
        caption: `${cat}照片 - ${['正面视角', '作品工艺细节', '作品信息铭牌', '艺术家创作中'][catIdx]}`,
        uploadedAt: date.toISOString()
      });
    });
  });
  return records;
}

/**
 * 生成用户上传照片种子数据
 */
function generateUserPhotoSeeds(artworkIds: number[]): Omit<UserPhoto, 'id'>[] {
  const authors = ['市民摄影爱好者', '旅行博主小鹿', '拍客小明', '手机摄影达人'];
  const records: Omit<UserPhoto, 'id'>[] = [];
  
  artworkIds.forEach((artworkId, idx) => {
    if (idx % 2 === 0) {
      const date = new Date(2024, idx % 11, idx + 10);
      records.push({
        artworkId,
        date: date.toISOString(),
        url: randomImage(artworkId * 600 + 1, 600, 450),
        author: authors[idx % authors.length],
        description: '路过时偶遇，随手拍下的好角度！'
      });
    }
  });
  return records;
}

/**
 * 初始化种子数据
 * 仅当数据库为空时执行
 */
export async function initSeedData(): Promise<{ seeded: boolean; message: string }> {
  try {
    const existingCount = (await artworkRepo.getAll()).length;
    if (existingCount > 0) {
      return { seeded: false, message: `数据库中已有 ${existingCount} 条作品数据，跳过种子数据初始化。` };
    }

    const artworkIds: number[] = [];
    for (const seed of artworkSeeds) {
      const id = await artworkRepo.create(seed);
      artworkIds.push(id);
      
      // 为部分作品设置随机初始浏览量
      if (id % 2 === 0) {
        const rand = Math.floor(Math.random() * 200) + 20;
        for (let i = 0; i < rand; i++) {
          await artworkRepo.incrementViewCount(id);
        }
      }
    }

    for (const seed of volunteerSeeds) {
      await volunteerRepo.create(seed);
    }

    for (const seed of generateInspectionSeeds(artworkIds)) {
      await inspectionRepo.create(seed);
      // 同步增加作品巡查次数
      await artworkRepo.incrementInspectionCount(seed.artworkId);
    }

    for (const seed of generateMaintenanceSeeds(artworkIds)) {
      await maintenanceRepo.create(seed);
    }

    for (const seed of generateCommentSeeds(artworkIds)) {
      await commentRepo.create(seed);
    }

    for (const seed of generatePhotoSeeds(artworkIds)) {
      await photoRepo.create(seed);
    }

    for (const seed of generateUserPhotoSeeds(artworkIds)) {
      await userPhotoRepo.create(seed);
    }

    return { 
      seeded: true, 
      message: `种子数据初始化成功！共创建 ${artworkIds.length} 件作品、${volunteerSeeds.length} 名志愿者及相关巡查、维护、评论、照片记录。` 
    };
  } catch (error) {
    console.error('种子数据初始化失败:', error);
    return { seeded: false, message: `初始化失败: ${error instanceof Error ? error.message : String(error)}` };
  }
}
