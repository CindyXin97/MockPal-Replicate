import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL!);

const originalInterviewQuestions = [
  // Meta 题目 (13道)
  {
    company: 'Meta',
    position: '数据分析师',
    questionType: 'technical',
    difficulty: 'medium',
    question: '如果Facebook的用户参与度下降了5%，你会如何分析这个问题？请描述你的分析框架和可能的解决方案。',
    recommendedAnswer: '分析框架：1. 定义问题范围：确认参与度指标定义（DAU、会话时长、点赞/评论数等）2. 时间维度分析：确认下降是突然发生还是渐进式的3. 用户分群分析：按年龄、地区、设备类型等维度细分4. 产品功能分析：检查是否有新功能上线或bug5. 外部因素：竞争对手动态、季节性因素、重大事件\n\n可能原因和解决方案：- 技术问题：修复bug，优化性能- 产品变化：A/B测试验证，回滚有问题的功能- 用户行为变化：调整推荐算法，增加个性化内容- 竞争压力：分析竞品优势，制定差异化策略\n\n建议使用漏斗分析、队列分析等方法深入调查。',
    tags: '',
    source: 'Glassdoor',
    year: 2024,
    isVerified: true
  },
  {
    company: 'Meta',
    position: '数据科学家',
    questionType: 'technical',
    difficulty: 'hard',
    question: '设计一个A/B测试来评估新的推荐算法对用户留存率的影响。请考虑样本量计算、实验设计和潜在的偏差。',
    recommendedAnswer: '实验设计：1. 假设设定：H0: 新算法对留存率无影响；H1: 新算法提高留存率2. 指标定义：主要指标：7天留存率；次要指标：30天留存率、用户参与度3. 样本量计算：基于历史留存率、期望提升幅度、统计功效计算所需样本量4. 随机化设计：用户级别随机分配，确保平衡性5. 实验期间：至少运行2周，覆盖完整的用户生命周期\n\n潜在偏差控制：- 新用户偏差：分别分析新老用户- 时间偏差：考虑季节性和趋势- 网络效应：考虑社交网络的影响- 学习效应：算法需要时间学习用户偏好\n\n统计分析：使用生存分析、因果推断方法评估效果。',
    tags: '',
    source: 'Blind',
    year: 2024,
    isVerified: true
  },
  {
    company: 'Meta',
    position: '产品分析师',
    questionType: 'case_study',
    difficulty: 'medium',
    question: 'Instagram Stories的完成率突然下降了15%。作为产品分析师，你会如何调查这个问题？',
    recommendedAnswer: '调查框架：1. 问题确认：验证指标定义和计算方法的准确性；确认下降的时间点和持续性2. 维度分析：按用户群体、设备类型、地理位置、内容类型分析；识别受影响最严重的细分市场3. 根因分析：产品变更：检查近期的功能更新、算法调整；技术问题：服务器性能、加载速度、bug；内容质量：Stories内容的变化趋势；用户行为：用户习惯的自然演变4. 外部因素：竞争对手的新功能或营销活动；季节性因素或重大事件影响\n\n数据收集：定量数据：完成率趋势、用户行为漏斗、技术性能指标；定性数据：用户反馈、客服投诉、内部团队反馈\n\n行动计划：短期：修复明显的技术问题；中期：优化用户体验和内容质量；长期：产品策略调整',
    tags: '',
    source: 'Glassdoor',
    year: 2024,
    isVerified: true
  },
  {
    company: 'Meta',
    position: '数据科学家',
    questionType: 'technical',
    difficulty: 'hard',
    question: '如何构建一个模型来预测用户是否会在接下来的30天内取消关注某个页面？',
    recommendedAnswer: '模型构建步骤：1. 特征工程：用户行为特征：互动频率、点赞/评论历史、访问时长；页面特征：内容质量、发布频率、页面类型；关系特征：关注时长、互动深度、共同好友数；时间特征：季节性模式、趋势变化2. 标签定义：正例：30天内取消关注；负例：30天后仍保持关注；处理数据不平衡问题3. 模型选择：逻辑回归：可解释性强；随机森林：处理非线性关系；XGBoost：高预测精度；神经网络：捕捉复杂模式4. 模型训练：时间分割验证，避免数据泄漏；处理类别不平衡（SMOTE、权重调整）5. 模型评估：AUC-ROC、Precision-Recall曲线；业务指标：预测准确率、召回率\n\n模型应用：风险用户识别；个性化内容推荐；用户留存策略；A/B测试效果评估',
    tags: '',
    source: 'LeetCode Discuss',
    year: 2024,
    isVerified: true
  },
  {
    company: 'Meta',
    position: '数据科学家',
    questionType: 'stats',
    difficulty: 'hard',
    question: '在Meta的大规模A/B测试中，如何处理多重比较问题？如果同时测试100个不同的产品变化，你会如何控制整体的错误率？',
    recommendedAnswer: '多重比较控制方法：1. Bonferroni校正：调整显著性水平 α_adjusted = α/n；优点：简单易懂；缺点：过于保守2. Holm-Bonferroni逐步校正：按p值从小到大排序逐步检验；比Bonferroni更有效力3. FDR控制（Benjamini-Hochberg）：控制假发现率而非家族错误率；适合探索性分析4. 分层测试：区分主要假设和次要假设；对主要假设使用更严格的标准5. 预先设定的分析计划：明确主要终点和次要终点；减少数据挖掘的风险\n\nMeta特定策略：分阶段测试：先进行小规模测试，再扩大范围；业务优先级：根据业务重要性分配α预算；实时监控：动态调整实验参数；贝叶斯方法：结合先验信息，更灵活的决策框架',
    tags: '',
    source: '一亩三分地',
    year: 2025,
    isVerified: true
  },
  {
    company: 'Meta',
    position: '产品分析师',
    questionType: 'stats',
    difficulty: 'medium',
    question: '解释什么是统计功效(Statistical Power)，以及如何在实验设计中应用？',
    recommendedAnswer: '统计功效定义：在真实效应存在时，正确拒绝零假设的概率；通常设定为80%或90%；与α（第一类错误）、β（第二类错误）相关：Power = 1 - β\n\n影响因素：1. 效应大小：期望检测的最小差异；效应越大，所需功效越容易达到2. 样本大小：样本越大，统计功效越高3. 显著性水平α：α越大，功效越高（但第一类错误增加）4. 数据变异性：变异性越小，功效越高\n\n实验设计应用：1. 样本大小计算：根据期望效应大小、功效要求计算最小样本量2. 实验可行性评估：评估是否有足够资源达到所需功效3. 效应大小评估：确定业务上有意义的最小效应4. 实验优化：通过减少变异性（分层、协变量调整）提高功效5. 后验分析：实验结束后评估实际达到的功效',
    tags: '',
    source: '一亩三分地',
    year: 2025,
    isVerified: true
  },
  {
    company: 'Meta',
    position: '数据科学家',
    questionType: 'technical',
    difficulty: 'hard',
    question: '如何设计一个系统来实时检测Instagram上的异常用户行为（如机器人账户）？',
    recommendedAnswer: '异常检测系统设计：1. 特征提取：用户行为特征：发布频率、互动模式、在线时间分布；内容特征：文本相似度、图片重复率、标签使用模式；网络特征：关注者质量、互动网络结构、传播模式；设备特征：设备指纹、IP地址、地理位置一致性2. 实时流处理：使用Kafka收集用户行为日志；Spark Streaming进行实时特征计算；Redis缓存用户状态和历史特征3. 异常检测算法：无监督方法：Isolation Forest、One-Class SVM、LOF；监督学习：基于已知机器人账户训练分类器；深度学习：自编码器检测异常模式4. 规则引擎：基于业务规则的快速筛选；阈值告警和自动处理5. 反馈机制：人工审核结果用于模型优化；持续学习和模型更新',
    tags: '',
    source: 'LeetCode Discuss',
    year: 2025,
    isVerified: true
  },
  {
    company: 'Meta',
    position: '产品分析师',
    questionType: 'behavioral',
    difficulty: 'medium',
    question: '描述一次你通过数据分析发现了意外洞察的经历，这个发现如何影响了产品决策？',
    recommendedAnswer: '使用STAR方法回答：Situation（情况）：在分析用户留存数据时，发现了一个反直觉的现象；Task（任务）：深入调查这个异常现象，并提供可行的解释和建议；Action（行动）：1. 数据验证：确认数据质量和计算逻辑的正确性2. 维度分析：按用户群体、时间、功能使用等维度细分3. 假设生成：提出多种可能的解释4. 验证分析：通过额外数据源和分析方法验证假设5. 业务影响评估：量化发现的业务价值；Result（结果）：1. 发现了新的用户行为模式2. 推动产品团队调整功能优先级3. 实施改进措施后，相关指标提升X%4. 建立了新的监控机制，避免类似问题\n\n学到的经验：数据分析不仅要关注预期结果，更要关注异常和意外；跨部门合作对于理解业务背景至关重要',
    tags: '',
    source: 'Blind',
    year: 2024,
    isVerified: true
  },
  {
    company: 'Meta',
    position: '数据分析师',
    questionType: 'technical',
    difficulty: 'medium',
    question: '如何衡量Facebook广告投放的ROI？请设计一个完整的分析框架。',
    recommendedAnswer: '广告ROI分析框架：1. 指标定义：直接ROI：(广告收入 - 广告成本) / 广告成本；间接价值：品牌认知提升、用户获取、长期价值2. 归因模型：最后点击归因：简单但可能低估其他触点价值；首次点击归因：重视发现阶段的贡献；多触点归因：更全面但复杂；数据驱动归因：基于机器学习的动态权重3. 时间窗口设置：短期ROI：1-7天内的直接转化；中期ROI：30天内的累积效应；长期ROI：考虑用户生命周期价值4. 细分分析：按广告类型、目标受众、投放时间等维度分析；识别高ROI的组合和低效投放5. 增量分析：通过实验设计（对照组）测量广告的真实增量效应；排除自然转化的影响\n\n分析工具：因果推断方法；机器学习归因模型；多媒体组合建模(MMM)；用户行为追踪和分析',
    tags: '',
    source: 'Glassdoor',
    year: 2024,
    isVerified: true
  },
  {
    company: 'Meta',
    position: '数据科学家',
    questionType: 'case_study',
    difficulty: 'hard',
    question: 'Meta考虑推出一个新的社交功能，类似于Clubhouse的语音聊天室。如何评估这个功能的市场潜力和用户需求？',
    recommendedAnswer: '市场评估框架：1. 市场分析：竞品分析：Clubhouse、Twitter Spaces等的用户数据和功能对比；市场规模：语音社交的整体市场趋势；用户行为：现有用户对语音内容的消费习惯2. 用户需求调研：定量研究：大规模用户调研，了解对语音聊天的兴趣和使用意愿；定性研究：焦点小组、深度访谈了解具体需求；行为分析：分析用户在现有语音功能上的使用模式3. 技术可行性：基础设施：语音处理、实时传输的技术要求；成本评估：开发和运营成本；时间规划：开发周期和上线时间4. 商业模式：变现方式：广告、付费功能、虚拟礼品；收入预测：基于用户规模和付费率的收入模型5. 风险评估：竞争风险：其他平台的快速跟进；监管风险：内容审核和隐私保护；技术风险：音频质量和网络稳定性\n\n实施建议：MVP测试：小规模试点验证核心假设；分阶段推出：逐步扩大用户范围；数据驱动：建立完整的指标体系监控表现',
    tags: '',
    source: 'Blind',
    year: 2024,
    isVerified: true
  },
  {
    company: 'Meta',
    position: '产品分析师',
    questionType: 'technical',
    difficulty: 'medium',
    question: '如何分析WhatsApp群组功能的使用效果？请设计关键指标和分析方法。',
    recommendedAnswer: '群组功能分析框架：1. 核心指标设计：用户参与指标：群组创建率、加入率、活跃群组数；互动质量：消息发送频率、回复率、多媒体分享率；留存效果：群组用户的整体留存率vs非群组用户2. 群组健康度：群组生命周期：从创建到活跃到沉寂的时间分布；群组规模分析：不同大小群组的活跃度差异；管理员效应：有无管理员对群组活跃度的影响3. 用户体验分析：功能使用率：各种群组功能的采用情况；用户反馈：通过调研了解用户满意度和痛点；流失分析：用户退出群组的原因和模式4. 商业影响：用户价值：群组用户的LTV vs 普通用户；网络效应：群组功能对整体用户增长的贡献；变现潜力：群组相关的商业化机会5. 技术性能：系统负载：群组功能对服务器性能的影响；消息传输：群组消息的延迟和可靠性\n\n分析方法：队列分析、漏斗分析、网络分析、A/B测试',
    tags: '',
    source: 'Glassdoor',
    year: 2024,
    isVerified: true
  },
  {
    company: 'Meta',
    position: '数据分析师',
    questionType: 'stats',
    difficulty: 'medium',
    question: '在分析Instagram Reels的观看时长数据时，你发现数据分布是右偏的。你会如何处理这种情况？选择什么统计方法？',
    recommendedAnswer: '右偏分布处理方案：1. 数据探索和理解：分布特征：大多数用户观看时长较短，少数用户观看很长；业务含义：符合内容消费的自然规律；异常值识别：区分真实的长时间观看和数据错误2. 描述性统计调整：中心趋势：使用中位数而非均值；变异性：使用四分位距(IQR)而非标准差；百分位数：报告P25, P50, P75, P90等关键百分位3. 数据变换技术：对数变换：log(观看时长 + 1)处理零值；Box-Cox变换：自动选择最优变换参数；平方根变换：适度减少偏度4. 统计方法选择：非参数方法：Mann-Whitney U检验、Kruskal-Wallis检验；稳健统计：使用对异常值不敏感的估计量；分位数回归：分析不同百分位数的影响因素5. 建模策略：广义线性模型：使用合适的分布族(Gamma, 对数正态)；混合分布模型：区分不同用户群体；生存分析：将观看时长视为生存时间\n\n业务应用：用户分层：基于观看行为模式分类；内容优化：针对不同观看习惯优化内容长度；推荐算法：考虑用户的观看时长偏好',
    tags: '',
    source: '一亩三分地',
    year: 2025,
    isVerified: true
  },
  {
    company: 'Meta',
    position: '数据科学家',
    questionType: 'stats',
    difficulty: 'hard',
    question: '解释贝叶斯统计在Meta产品分析中的应用，特别是在A/B测试和用户行为预测方面。',
    recommendedAnswer: '贝叶斯统计在Meta的应用：1. 贝叶斯A/B测试：先验信息利用：结合历史实验数据作为先验；动态决策：实时更新后验概率，支持早期停止；不确定性量化：提供概率区间而非点估计；业务友好：直接回答"B比A好的概率是多少"2. 用户行为预测：贝叶斯网络：建模用户行为之间的依赖关系；层次贝叶斯模型：处理用户异质性；在线学习：实时更新用户偏好模型3. 个性化推荐：多臂老虎机：Thompson Sampling平衡探索和利用；贝叶斯协同过滤：处理数据稀疏问题；冷启动问题：利用先验信息处理新用户4. 因果推断：贝叶斯因果网络：识别因果关系；倾向性评分：贝叶斯方法估计处理效应；工具变量：贝叶斯框架下的工具变量分析5. 实际实施：计算挑战：MCMC、变分推断等近似方法；模型选择：贝叶斯信息准则；敏感性分析：评估先验选择的影响\n\n优势：融合先验知识；处理不确定性；支持序贯决策；提供概率解释',
    tags: '',
    source: '一亩三分地',
    year: 2025,
    isVerified: true
  },

  // Google 题目 (8道)
  {
    company: 'Google',
    position: '数据科学家',
    questionType: 'technical',
    difficulty: 'hard',
    question: '如何设计一个推荐系统来提高YouTube的用户观看时长？请详细描述你的方法。',
    recommendedAnswer: '推荐系统设计：1. 数据收集和特征工程：用户特征：观看历史、搜索记录、互动行为、设备信息；内容特征：视频元数据、内容标签、质量评分；上下文特征：时间、地点、设备类型2. 推荐算法：协同过滤：基于用户行为相似性推荐；内容过滤：基于视频特征匹配用户偏好；深度学习：Neural Collaborative Filtering、Wide & Deep模型；多目标优化：平衡点击率、观看时长、用户满意度3. 模型架构：召回阶段：从海量视频中快速筛选候选集；排序阶段：精确预测用户对候选视频的偏好；重排序：考虑多样性、新鲜度等业务目标4. 实时更新：在线学习：实时捕捉用户兴趣变化；A/B测试：持续优化推荐策略；反馈循环：用户行为反馈改进模型5. 评估指标：观看时长：总观看时间和平均观看时间；用户参与：点击率、完成率、点赞分享率；长期价值：用户留存和生命周期价值',
    tags: '',
    source: 'LeetCode Discuss',
    year: 2024,
    isVerified: true
  },
  {
    company: 'Google',
    position: '产品分析师',
    questionType: 'stats',
    difficulty: 'medium',
    question: '解释p-value的含义，以及在A/B测试中如何正确使用和解释它。',
    recommendedAnswer: 'p-value定义和含义：定义：在零假设为真的前提下，观察到当前结果或更极端结果的概率；不是：零假设为真的概率，也不是效应大小的度量；正确解释：如果零假设为真，有p%的概率观察到这样的结果\n\nA/B测试中的正确使用：1. 假设设定：明确零假设(H0)和备择假设(H1)；预设显著性水平α(通常0.05)2. 实验设计：确保样本大小足够；随机分组避免偏差；控制其他变量3. 结果解释：p < α：拒绝零假设，认为存在显著差异；p ≥ α：不拒绝零假设，不能说明无差异；结合置信区间和效应大小进行解释4. 常见误区：p-hacking：多重测试寻找显著结果；过度解释：认为p值越小效应越大；忽略实际意义：统计显著不等于业务显著5. 最佳实践：预先设定分析计划；报告效应大小和置信区间；考虑多重比较校正；结合业务背景解释结果',
    tags: '',
    source: 'Glassdoor',
    year: 2024,
    isVerified: true
  },
  {
    company: 'Google',
    position: '数据分析师',
    questionType: 'case_study',
    difficulty: 'medium',
    question: 'Google搜索的点击率突然下降了10%，请设计一个分析框架来找出原因。',
    recommendedAnswer: '问题诊断框架：1. 问题确认和范围界定：指标验证：确认点击率计算方法是否有变化；时间定位：精确确定下降开始的时间点；影响范围：是全球性还是特定地区的问题2. 维度分析：地理维度：按国家、地区分析，识别受影响区域；设备维度：移动端vs桌面端的表现差异；查询维度：不同类型搜索查询的点击率变化；用户维度：新用户vs老用户的行为差异3. 根因假设：产品变更：搜索算法更新、界面改版、新功能上线；技术问题：服务器性能、页面加载速度、bug；内容质量：搜索结果相关性下降；竞争因素：用户搜索行为向其他平台转移4. 数据深入分析：漏斗分析：从搜索到点击的各个环节；时间序列：识别趋势和异常模式；对比分析：与历史同期数据对比5. 验证和行动：假设验证：通过数据和实验验证最可能的原因；快速修复：针对技术问题的紧急修复；长期优化：产品和算法的持续改进',
    tags: '',
    source: 'Blind',
    year: 2024,
    isVerified: true
  },
  {
    company: 'Google',
    position: '数据科学家',
    questionType: 'technical',
    difficulty: 'hard',
    question: '如何构建一个模型来预测Gmail用户是否会将邮件标记为垃圾邮件？请描述特征工程和模型选择。',
    recommendedAnswer: '垃圾邮件检测模型：1. 特征工程：文本特征：邮件主题和正文的TF-IDF、n-gram特征；关键词检测：垃圾邮件常用词汇；语言模型：使用BERT等预训练模型提取语义特征；发送者特征：发送者域名、IP地址、发送频率；邮件结构：HTML标签、链接数量、附件类型；用户行为：历史标记行为、互动模式2. 标签处理：正例：用户主动标记的垃圾邮件；负例：正常邮件和用户未标记的邮件；处理标签噪声：考虑用户误标记的情况3. 模型选择：朴素贝叶斯：经典垃圾邮件检测方法，可解释性强；随机森林：处理特征交互，抗过拟合；梯度提升：XGBoost/LightGBM，高预测精度；深度学习：CNN/RNN处理文本序列，BERT进行语义理解4. 模型训练：数据不平衡：使用SMOTE、权重调整等方法；交叉验证：时间分割验证，避免数据泄漏；超参数优化：网格搜索或贝叶斯优化5. 评估和部署：评估指标：Precision、Recall、F1-score、AUC；业务指标：误杀率（正常邮件被标记为垃圾）；在线评估：A/B测试验证模型效果',
    tags: '',
    source: 'LeetCode Discuss',
    year: 2024,
    isVerified: true
  },
  {
    company: 'Google',
    position: '产品分析师',
    questionType: 'case_study',
    difficulty: 'medium',
    question: 'Google Maps的使用时长在某个地区突然增加了25%，你会如何分析这个现象？',
    recommendedAnswer: '现象分析框架：1. 数据验证：指标确认：验证使用时长的计算方法；数据质量：检查是否有数据收集异常；时间范围：确认增长的具体时间段和持续性2. 背景调研：地区特点：该地区的地理、经济、人口特征；时间因素：是否有特殊事件、节假日、季节性因素；外部环境：交通状况、城市建设、突发事件3. 用户行为分析：使用场景：导航、探索、商家查找等不同场景的使用变化；用户群体：新用户增长还是老用户使用增加；设备类型：移动端vs车载设备的使用情况4. 功能分析：新功能：是否有新功能上线促进使用；性能改进：应用速度、准确性的提升；内容更新：地图数据、商家信息的更新5. 竞争环境：竞品动态：其他地图应用的变化；市场份额：Google Maps在该地区的地位变化6. 假设验证：定量分析：通过数据细分验证各种假设；定性研究：用户访谈了解使用动机变化；实验设计：如果可能，设计实验验证因果关系',
    tags: '',
    source: 'Glassdoor',
    year: 2024,
    isVerified: true
  },
  {
    company: 'Google',
    position: '数据科学家',
    questionType: 'behavioral',
    difficulty: 'easy',
    question: '描述一次你需要向非技术团队解释复杂数据分析结果的经历。你是如何确保他们理解并采取行动的？',
    recommendedAnswer: '使用STAR方法：Situation：需要向产品和营销团队解释用户留存分析的复杂结果；Task：将技术性的分析结果转化为可操作的业务洞察；Action：1. 受众分析：了解团队的背景知识和关注重点2. 简化语言：避免统计术语，使用业务语言3. 可视化呈现：制作直观的图表和仪表板4. 故事化叙述：将数据结果组织成逻辑清晰的故事5. 互动交流：鼓励提问，确保理解6. 行动导向：明确指出数据结果对业务的影响和建议行动；Result：1. 团队成功理解了分析结果2. 基于分析结果调整了产品策略3. 建立了定期的数据分享机制4. 提高了团队的数据驱动决策能力\n\n学到的经验：沟通是数据科学家的重要技能；理解业务背景对于有效沟通至关重要；可视化和故事化是强有力的沟通工具',
    tags: '',
    source: 'Blind',
    year: 2024,
    isVerified: true
  },
  {
    company: 'Google',
    position: '数据分析师',
    questionType: 'technical',
    difficulty: 'medium',
    question: '如何分析Google Play Store应用下载量的影响因素？请设计分析方法和关键指标。',
    recommendedAnswer: '应用下载量分析框架：1. 影响因素识别：应用特征：类别、评分、价格、大小、更新频率；描述信息：标题、描述、截图、视频预览；开发者因素：开发者声誉、历史应用表现；市场因素：竞争应用数量、市场趋势；推广活动：广告投入、促销活动、媒体报道2. 数据收集：内部数据：下载量、用户评价、搜索排名；外部数据：社交媒体提及、新闻报道、竞品信息；用户调研：下载动机、决策因素3. 分析方法：描述性分析：各因素与下载量的相关性；回归分析：量化各因素的影响程度；时间序列分析：识别趋势和季节性模式；因果推断：区分相关性和因果关系4. 关键指标：下载转化率：从展示到下载的转化；搜索排名：在相关关键词下的排名；用户评价：平均评分和评价数量；留存率：下载后的用户留存情况5. 模型构建：特征工程：创建组合特征和交互项；模型选择：线性回归、随机森林、神经网络；模型评估：交叉验证和业务指标验证',
    tags: '',
    source: 'Glassdoor',
    year: 2024,
    isVerified: true
  },
  {
    company: 'Google',
    position: '数据工程师',
    questionType: 'technical',
    difficulty: 'hard',
    question: '设计一个大规模数据管道来处理Google Analytics的实时数据流，每秒需要处理100万个事件。请描述架构和技术选择。',
    recommendedAnswer: '大规模数据管道设计：1. 数据接入层：Apache Kafka：高吞吐量消息队列，支持分区和副本；数据格式：Avro/Protobuf确保schema演化；负载均衡：多个Kafka broker分担负载2. 流处理层：Apache Beam：统一批处理和流处理API；Apache Flink：低延迟流处理，支持exactly-once语义；数据转换：清洗、聚合、丰富数据；窗口操作：滑动窗口、会话窗口处理3. 存储层：实时存储：Apache Cassandra/HBase支持高写入；批处理存储：HDFS/Google Cloud Storage；数据仓库：BigQuery进行OLAP查询；缓存层：Redis/Memcached支持快速查询4. 监控和容错：数据质量监控：数据完整性、准确性检查；系统监控：Prometheus + Grafana；容错机制：检查点、重启策略；数据血缘：跟踪数据流转和依赖5. 性能优化：分区策略：按时间、用户ID等分区；压缩：数据压缩减少存储和传输成本；并行度：根据资源调整并行度；背压处理：流量控制避免系统过载',
    tags: '',
    source: 'LeetCode Discuss',
    year: 2024,
    isVerified: true
  },

  // Amazon 题目 (6道)
  {
    company: 'Amazon',
    position: '数据科学家',
    questionType: 'technical',
    difficulty: 'medium',
    question: '如何分析Amazon Prime会员的流失原因？请描述你的分析方法和可能采取的措施。',
    recommendedAnswer: '流失分析框架：1. 流失定义：时间窗口：定义多长时间未续费算作流失；行为标准：考虑使用频率、最后活跃时间；分层定义：区分主动取消和被动流失2. 数据收集：用户特征：人口统计、地理位置、加入时间；使用行为：购物频率、视频观看、其他服务使用；交互记录：客服联系、投诉记录、评价反馈；外部因素：竞争对手活动、经济环境3. 分析方法：生存分析：Kaplan-Meier生存曲线分析会员生命周期；Cox回归：识别影响流失风险的因素；队列分析：按加入时间分组分析流失模式；决策树：识别高风险用户群体4. 特征工程：RFM分析：最近购买时间、购买频率、购买金额；使用深度：不同服务的使用广度和深度；趋势特征：使用行为的变化趋势；满意度代理：退货率、评价分数5. 预测模型：逻辑回归：可解释的流失概率预测；随机森林：捕捉非线性关系；深度学习：处理复杂的用户行为模式\n\n干预措施：个性化挽回：基于流失原因的定制化优惠；产品改进：针对主要流失原因优化服务；预警系统：早期识别高风险用户',
    tags: '',
    source: 'Glassdoor',
    year: 2024,
    isVerified: true
  },
  {
    company: 'Amazon',
    position: '商业分析师',
    questionType: 'case_study',
    difficulty: 'hard',
    question: 'Amazon考虑推出一个新的配送服务，如何评估这个项目的可行性和潜在ROI？',
    recommendedAnswer: '项目可行性评估：1. 市场分析：目标市场：定义服务的目标用户群体和地理范围；市场规模：估算潜在市场容量和增长趋势；竞争分析：现有配送服务的优劣势对比；用户需求：通过调研验证用户对新服务的需求强度2. 技术可行性：基础设施：现有物流网络的支持能力；技术要求：需要开发的新技术和系统；运营复杂度：服务实施的操作难度；扩展性：服务规模化的技术障碍3. 财务分析：成本结构：初始投资、运营成本、边际成本；收入模型：定价策略、收费模式、收入预测；ROI计算：投资回报期、净现值、内部收益率；敏感性分析：关键假设变化对ROI的影响4. 风险评估：市场风险：需求不达预期、竞争加剧；运营风险：服务质量、配送延误；监管风险：政策变化、合规要求；技术风险：系统故障、安全问题5. 实施计划：试点测试：小规模市场测试验证假设；分阶段推出：逐步扩大服务范围；关键里程碑：设定明确的评估节点；资源配置：人力、资金、技术资源的分配\n\n决策建议：基于分析结果提供明确的go/no-go建议；制定详细的实施路线图；建立持续监控和调整机制',
    tags: '',
    source: 'Blind',
    year: 2024,
    isVerified: true
  },
  {
    company: 'Amazon',
    position: '数据分析师',
    questionType: 'technical',
    difficulty: 'medium',
    question: '如何分析Amazon网站的搜索功能效果？请设计关键指标和分析框架。',
    recommendedAnswer: '搜索功能分析框架：1. 关键指标设计：搜索成功率：有结果的搜索占比；点击率：搜索结果的点击率；转化率：从搜索到购买的转化；搜索深度：用户查看搜索结果的页数；搜索精度：相关结果在前几位的比例2. 用户体验指标：搜索延迟：搜索响应时间；零结果率：没有找到结果的搜索比例；查询重构：用户修改搜索词的频率；放弃率：搜索后直接离开的用户比例3. 商业指标：搜索驱动的GMV：通过搜索产生的交易额；搜索用户价值：搜索用户的LTV vs 非搜索用户；转化漏斗：搜索→点击→加购物车→购买的转化率4. 分析方法：搜索词分析：热门搜索词、长尾搜索词的表现；结果质量：人工评估和用户行为验证；A/B测试：搜索算法和界面的优化实验；用户旅程：分析用户的搜索行为路径5. 技术指标：索引覆盖率：商品被索引的完整性；搜索算法性能：相关性算法的效果评估；系统稳定性：搜索服务的可用性和性能\n\n优化方向：算法改进：提高搜索结果的相关性；界面优化：改善搜索体验；个性化：基于用户历史的个性化搜索',
    tags: '',
    source: 'Glassdoor',
    year: 2024,
    isVerified: true
  },
  {
    company: 'Amazon',
    position: '数据科学家',
    questionType: 'technical',
    difficulty: 'hard',
    question: '如何构建一个推荐系统来提高Amazon的交叉销售效果？请描述算法选择和评估方法。',
    recommendedAnswer: '交叉销售推荐系统：1. 问题定义：目标：在用户浏览或购买某商品时推荐相关商品；场景：商品详情页、购物车、结账页面；成功指标：点击率、加购率、购买转化率、客单价提升2. 数据准备：用户行为：浏览、购买、评价、收藏历史；商品特征：类别、品牌、价格、属性、销量；交易数据：购买组合、时间序列、季节性；上下文信息：设备、时间、地理位置3. 算法策略：基于商品的协同过滤：商品相似度计算，推荐相似商品；市场篮分析：Apriori算法发现频繁项集；深度学习：使用神经网络捕捉复杂的商品关系；图神经网络：建模用户-商品-属性的复杂关系4. 特征工程：商品嵌入：学习商品的向量表示；用户画像：构建多维度的用户特征；时间特征：考虑购买的时间依赖性；价格敏感性：用户对价格的敏感度5. 模型融合：多策略融合：结合不同算法的优势；在线学习：实时更新推荐模型；冷启动处理：新商品和新用户的推荐策略6. 评估方法：离线评估：准确率、召回率、多样性；在线A/B测试：业务指标的直接对比；长期效果：用户满意度和留存的影响',
    tags: '',
    source: 'LeetCode Discuss',
    year: 2024,
    isVerified: true
  },
  {
    company: 'Amazon',
    position: '商业分析师',
    questionType: 'behavioral',
    difficulty: 'medium',
    question: '描述一次你的分析结果与直觉或预期不符的情况，你是如何处理的？',
    recommendedAnswer: '使用STAR方法：Situation：在分析促销活动效果时，发现结果与预期相反；Task：验证分析的正确性并找出原因；Action：1. 数据验证：重新检查数据质量、计算逻辑、样本选择；确认指标定义和业务逻辑的一致性2. 方法验证：检查分析方法的适用性；考虑是否有遗漏的重要因素3. 深入调研：与业务团队讨论，了解可能的业务背景；查阅相关文献和行业报告4. 假设生成：提出多种可能的解释；设计验证方案测试各种假设5. 沟通协作：及时向相关团队汇报发现；邀请领域专家参与讨论；Result：1. 发现了一个之前被忽略的重要因素2. 修正了对业务的理解3. 建立了更完善的分析框架4. 为后续类似分析提供了经验\n\n学到的经验：保持开放心态，质疑自己的假设；数据分析要结合业务理解；意外发现往往蕴含重要洞察；团队协作对于解决复杂问题很重要',
    tags: '',
    source: 'Blind',
    year: 2024,
    isVerified: true
  },
  {
    company: 'Amazon',
    position: '数据分析师',
    questionType: 'case_study',
    difficulty: 'medium',
    question: '如果Amazon的某个商品类别的销售额突然下降了20%，你会如何分析这个问题？',
    recommendedAnswer: '销售下降分析框架：1. 问题确认：数据验证：确认销售额计算的准确性；时间范围：精确定位下降的起始时间和持续期；影响范围：是否影响所有子类别或特定商品2. 维度分析：地理维度：不同地区的销售表现；渠道维度：网站、移动端、第三方平台的差异；用户维度：新老客户、不同用户群体的购买变化；商品维度：热销商品vs长尾商品的表现3. 根因假设：内部因素：库存短缺：关键商品的库存问题；价格变动：定价策略调整的影响；页面变更：商品展示、搜索排名的变化；促销活动：促销力度的变化；外部因素：竞争对手：竞品促销、新产品上市；市场趋势：消费者偏好变化、季节性因素；经济环境：消费能力下降、支出结构调整4. 数据深入分析：销售漏斗：流量→浏览→加购→购买各环节的变化；价格弹性：分析价格变化对销量的影响；用户行为：购买频率、客单价、复购率的变化5. 验证和行动：快速实验：测试关键假设；紧急措施：针对明确问题的快速修复；长期策略：基于根本原因的系统性改进',
    tags: '',
    source: 'Glassdoor',
    year: 2024,
    isVerified: true
  },

  // 其他公司题目 (14道) - 新增数据工程师和商业分析师题目
  {
    company: 'Microsoft',
    position: '数据分析师',
    questionType: 'behavioral',
    difficulty: 'easy',
    question: '描述一次你处理复杂数据问题的经历，包括遇到的挑战和解决方案。',
    recommendedAnswer: '使用STAR方法回答：Situation（情况）：描述具体的业务场景和数据问题；Task（任务）：明确你的职责和目标；Action（行动）：详细说明采取的分析方法和工具；Result（结果）：量化业务影响和学到的经验',
    tags: '',
    source: 'Glassdoor',
    year: 2024,
    isVerified: true
  },
  {
    company: 'Microsoft',
    position: '数据工程师',
    questionType: 'technical',
    difficulty: 'medium',
    question: '如何为Microsoft Teams设计一个ETL管道来处理用户活动数据？请描述数据架构和处理流程。',
    recommendedAnswer: 'Teams数据ETL管道设计：1. 数据提取(Extract)：数据源：Teams客户端日志、服务器日志、数据库表；提取方式：CDC(Change Data Capture)实时捕获；API调用：Graph API获取用户和团队信息；日志收集：使用Azure Event Hubs收集实时事件2. 数据转换(Transform)：数据清洗：去重、格式标准化、异常值处理；数据丰富：用户信息、组织结构、地理位置；聚合计算：会议时长、消息统计、活跃度指标；隐私保护：PII数据脱敏、GDPR合规处理3. 数据加载(Load)：数据仓库：Azure Synapse Analytics存储结构化数据；数据湖：Azure Data Lake存储原始和半结构化数据；实时存储：Azure Cosmos DB支持低延迟查询4. 技术栈：编排工具：Azure Data Factory管理ETL流程；处理引擎：Spark/Databricks进行大规模数据处理；监控：Azure Monitor + Application Insights；数据质量：Great Expectations验证数据质量5. 性能优化：分区策略：按日期、租户分区；增量处理：只处理变更数据；并行处理：多线程、分布式处理；缓存策略：热数据缓存加速查询',
    tags: '',
    source: 'LeetCode Discuss',
    year: 2024,
    isVerified: true
  },
  {
    company: 'Netflix',
    position: '商业分析师',
    questionType: 'case_study',
    difficulty: 'hard',
    question: '如何评估Netflix新内容投资的ROI？请设计一个完整的评估框架。',
    recommendedAnswer: 'Netflix内容投资ROI评估：1. 成本分析：直接成本：制作成本、版权购买费用、营销推广费用；间接成本：平台运营、技术支持、人力成本；机会成本：投资其他内容的潜在收益2. 收益计算：直接收益：新增订阅用户带来的订阅费；间接收益：减少的用户流失、提高的用户满意度；长期价值：品牌价值提升、市场地位巩固3. 用户价值分析：新增用户：内容吸引的新订阅用户数量和质量；用户留存：内容对现有用户留存率的影响；用户参与：观看时长、完成率、重复观看的提升4. 内容表现指标：观看数据：总观看时长、观看用户数、完成率；用户反馈：评分、评论、社交媒体讨论；奖项认可：行业奖项、批评家评价5. 对比分析：历史对比：与过去类似投资的ROI对比；竞品对比：与竞争对手类似内容的表现对比；投资组合：在整个内容投资组合中的表现6. 长期影响：品牌建设：对Netflix品牌形象的长期影响；市场竞争：在流媒体竞争中的战略价值；全球扩张：对国际市场拓展的贡献',
    tags: '',
    source: 'Blind',
    year: 2024,
    isVerified: true
  },
  {
    company: 'Uber',
    position: '数据工程师',
    questionType: 'technical',
    difficulty: 'hard',
    question: '设计一个实时数据平台来处理Uber的出行数据，支持司机匹配、定价和路线优化。请描述系统架构。',
    recommendedAnswer: 'Uber实时数据平台设计：1. 数据接入层：位置数据：司机和乘客的实时GPS数据；订单数据：下单、接单、行程状态变更；外部数据：交通状况、天气、事件信息；消息队列：Apache Kafka高吞吐量数据接入2. 流处理层：Apache Flink：低延迟流处理，支持复杂事件处理；数据处理：位置聚合、供需计算、异常检测；窗口操作：滑动窗口计算实时指标；状态管理：维护司机状态、订单状态3. 存储层：实时存储：Redis存储热数据，支持毫秒级查询；时序数据库：InfluxDB存储位置轨迹数据；图数据库：Neo4j存储路网和POI数据；数据湖：S3存储历史数据用于离线分析4. 服务层：匹配服务：基于位置、供需的实时司机匹配；定价服务：动态定价算法，考虑供需、距离、时间；路径服务：实时路径规划和ETA预测；地理服务：地理编码、逆地理编码5. 监控和运维：实时监控：Prometheus + Grafana监控系统指标；数据质量：实时数据质量检查和告警；容灾：多区域部署，故障自动切换；性能调优：根据负载动态调整资源',
    tags: '',
    source: 'LeetCode Discuss',
    year: 2024,
    isVerified: true
  },
  {
    company: 'Apple',
    position: '数据分析师',
    questionType: 'technical',
    difficulty: 'medium',
    question: '如何分析iPhone新功能的用户采用率？请描述你的分析方法。',
    recommendedAnswer: '新功能采用率分析：1. 采用率定义：首次使用率：安装更新后首次使用新功能的用户比例；持续使用率：持续使用新功能的用户比例；深度使用率：充分利用功能各项特性的用户比例2. 用户分群：设备分群：按iPhone型号、iOS版本分析；用户特征：年龄、地区、使用习惯分群；采用时间：早期采用者vs后期采用者3. 时间序列分析：采用曲线：绘制功能采用的时间趋势；生命周期：从引入到成熟的采用模式；季节性：是否存在使用的季节性变化4. 影响因素分析：用户特征：哪些用户更容易采用新功能；功能特性：功能复杂度、易用性对采用率的影响；推广效果：App Store推荐、媒体报道的影响；网络效应：用户之间的相互影响5. 对比分析：历史功能：与过去类似功能的采用模式对比；竞品功能：与Android类似功能的采用情况对比；平台差异：不同平台用户的采用行为差异6. 预测模型：Bass扩散模型：预测功能采用的扩散过程；机器学习：预测个体用户的采用概率；情景分析：不同推广策略下的采用率预测',
    tags: '',
    source: 'Glassdoor',
    year: 2024,
    isVerified: true
  },
  {
    company: 'Airbnb',
    position: '商业分析师',
    questionType: 'case_study',
    difficulty: 'hard',
    question: 'Airbnb想要进入一个新的城市市场，如何评估市场机会和制定进入策略？',
    recommendedAnswer: '新市场进入分析：1. 市场规模评估：旅游需求：年度游客数量、增长趋势、消费水平；住宿供给：现有酒店容量、价格水平、入住率；市场缺口：供需不平衡的时间段和价格区间2. 竞争分析：直接竞争：其他短租平台的市场份额和策略；间接竞争：酒店、民宿等传统住宿的竞争力；差异化机会：Airbnb可以提供的独特价值3. 用户研究：需求方：游客的住宿偏好、价格敏感度、预订习惯；供给方：潜在房东的参与意愿、房源类型、定价策略；本地特色：文化因素、法规环境对业务的影响4. 运营可行性：本地化需求：语言、支付、客服的本地化要求；监管环境：当地政策、法规对短租业务的限制；基础设施：网络、物流、金融服务的支持能力5. 财务分析：收入预测：基于市场规模和渗透率的收入预估；成本结构：市场进入成本、运营成本、营销成本；盈利模型：达到盈亏平衡的时间和条件；风险评估：汇率风险、政策风险、竞争风险6. 进入策略：分阶段进入：试点区域→核心城区→全城覆盖；合作伙伴：与本地企业、政府的合作机会；营销策略：针对本地用户的获客和留存策略',
    tags: '',
    source: 'Blind',
    year: 2024,
    isVerified: true
  },
  {
    company: 'Twitter',
    position: '数据分析师',
    questionType: 'technical',
    difficulty: 'medium',
    question: '如何分析Twitter用户的参与度变化？请设计分析框架和关键指标。',
    recommendedAnswer: '用户参与度分析框架：1. 参与度指标定义：发布活动：推文数量、转发、回复、点赞；消费活动：阅读时长、点击率、滚动深度；互动质量：有意义的对话、关注新用户；时间投入：日均使用时长、会话频率2. 用户分层：活跃度分层：高活跃、中活跃、低活跃用户；用户类型：内容创作者、消费者、互动者；生命周期：新用户、成长用户、成熟用户、流失用户3. 时间维度分析：趋势分析：参与度的长期趋势变化；周期性：日内、周内、月内的参与模式；事件影响：热点事件、产品更新对参与度的影响4. 影响因素分析：内容因素：内容质量、话题热度、算法推荐；产品因素：功能更新、界面改版、新特性；外部因素：竞争对手、社会事件、季节性5. 细分分析：地理维度：不同地区用户的参与模式；设备维度：移动端vs桌面端的使用差异；内容类型：文字、图片、视频内容的参与度差异6. 预测模型：参与度预测：预测用户未来的参与水平；流失预警：识别参与度下降的风险用户；干预效果：评估提升参与度措施的效果',
    tags: '',
    source: 'Glassdoor',
    year: 2024,
    isVerified: true
  },
  {
    company: 'LinkedIn',
    position: '产品分析师',
    questionType: 'case_study',
    difficulty: 'medium',
    question: 'LinkedIn的职位推荐点击率下降了8%，你会如何分析这个问题？',
    recommendedAnswer: '职位推荐分析框架：1. 问题确认：指标验证：确认点击率计算方法的一致性；时间定位：确定下降开始的具体时间；范围界定：是全平台还是特定用户群体的问题2. 维度分析：用户维度：按行业、经验水平、地理位置分析；职位维度：不同类型职位的推荐表现；推荐位置：不同推荐位置的点击率变化；设备维度：移动端vs桌面端的差异3. 推荐系统分析：算法变更：推荐算法是否有更新或调整；数据质量：职位数据、用户画像数据的质量；相关性评估：推荐职位与用户兴趣的匹配度；多样性分析：推荐结果的多样性是否合适4. 用户体验分析：界面变化：职位展示界面是否有改动；加载速度：推荐页面的加载性能；竞争内容：其他内容对用户注意力的分散5. 外部因素：市场环境：就业市场的整体变化；竞争对手：其他招聘平台的动态；季节性：招聘淡旺季的影响6. 深入调研：用户反馈：收集用户对推荐质量的反馈；A/B测试：测试不同推荐策略的效果；定性研究：用户访谈了解行为变化原因',
    tags: '',
    source: 'Glassdoor',
    year: 2024,
    isVerified: true
  },
  {
    company: 'Spotify',
    position: '数据科学家',
    questionType: 'technical',
    difficulty: 'hard',
    question: '如何构建一个模型来预测用户会喜欢的新发布音乐？请描述推荐算法和冷启动策略。',
    recommendedAnswer: '音乐推荐系统：1. 特征工程：用户特征：听歌历史、喜好标签、人口统计信息；音乐特征：音频特征（节奏、调性、能量）、元数据（艺术家、流派、发行时间）；上下文特征：时间、地点、设备、心情；社交特征：朋友的听歌行为、社交网络影响2. 推荐算法：协同过滤：基于用户行为相似性的推荐；内容过滤：基于音乐特征相似性的推荐；深度学习：神经网络捕捉复杂的用户-音乐交互；混合模型：结合多种算法的优势3. 冷启动策略：新用户冷启动：基于人口统计信息的初始推荐；让用户选择喜欢的艺术家/流派；基于社交网络的推荐；新音乐冷启动：基于音频特征的相似性推荐；利用艺术家的历史表现；专家推荐和编辑精选4. 模型训练：隐式反馈：基于播放时长、跳过行为建模偏好；负采样：处理大量负样本的策略；时间衰减：考虑用户兴趣的时间变化；多任务学习：同时优化多个目标5. 评估方法：离线评估：准确率、召回率、多样性、新颖性；在线A/B测试：播放率、完成率、用户满意度；长期效果：用户留存、订阅转化6. 实时系统：流处理：实时更新用户偏好；缓存策略：热门推荐的缓存机制；个性化：为每个用户生成个性化推荐',
    tags: '',
    source: 'LeetCode Discuss',
    year: 2024,
    isVerified: true
  },
  {
    company: 'TikTok',
    position: '商业分析师',
    questionType: 'case_study',
    difficulty: 'medium',
    question: 'TikTok的视频完成率在某个地区突然下降了12%，你会如何调查这个问题？',
    recommendedAnswer: '视频完成率下降调查：1. 问题确认：指标定义：确认完成率的计算标准；时间范围：精确定位下降的时间点；地区范围：确定受影响的具体地区2. 数据分析：用户维度：不同年龄、性别用户群体的表现；内容维度：不同类型、时长视频的完成率；创作者维度：头部vs长尾创作者的影响；设备维度：不同设备型号、网络条件的差异3. 技术因素：应用性能：视频加载速度、播放流畅度；推荐算法：推荐质量是否下降；服务器问题：该地区服务器性能或网络问题4. 内容质量：内容审核：是否有内容质量下降；创作者活跃度：优质创作者是否减少发布；热门话题：是否缺乏吸引人的话题5. 竞争环境：竞品动态：其他短视频平台的新功能或活动；市场份额：用户是否转向其他平台；外部事件：当地文化、政策事件的影响6. 用户行为：使用习惯：用户使用时间、频率的变化；反馈收集：用户评论、应用商店评价；流失分析：是否有用户流失增加7. 解决方案：技术优化：改善视频加载和播放体验；内容策略：调整推荐算法，提升内容质量；运营活动：针对该地区的特色活动；创作者扶持：激励优质内容创作',
    tags: '',
    source: 'Blind',
    year: 2024,
    isVerified: true
  },
  {
    company: 'Snapchat',
    position: '数据分析师',
    questionType: 'technical',
    difficulty: 'medium',
    question: '如何分析Snapchat Stories功能的用户参与度？请设计分析方法和关键指标。',
    recommendedAnswer: 'Stories参与度分析：1. 参与度指标：发布指标：Stories发布数量、发布频率、发布时长；观看指标：Stories观看数、观看完成率、重复观看；互动指标：回复数量、截图数量、分享转发；留存指标：Stories用户的整体留存率2. 用户分层：发布者分析：活跃发布者vs偶尔发布者；观看者分析：重度观看者vs轻度观看者；互动者分析：高互动用户vs被动观看者3. 内容分析：内容类型：文字、图片、视频Stories的表现；内容长度：不同时长Stories的完成率；使用功能：滤镜、贴纸、音乐等功能的使用率4. 时间维度：使用时间：一天中不同时间段的发布和观看模式；生命周期：Stories从发布到过期的观看趋势；季节性：节假日、特殊事件对使用的影响5. 社交网络：好友网络：好友数量对Stories参与度的影响；互动网络：双向Stories互动的用户关系；影响力分析：热门Stories的传播模式6. 对比分析：功能对比：Stories vs其他功能的用户时间分配；平台对比：与其他平台类似功能的对比；历史对比：功能上线以来的发展趋势7. 预测模型：参与度预测：预测用户未来的Stories参与水平；内容成功预测：预测哪些Stories会获得高参与度',
    tags: '',
    source: 'Glassdoor',
    year: 2024,
    isVerified: true
  },
  {
    company: 'Pinterest',
    position: '数据科学家',
    questionType: 'technical',
    difficulty: 'hard',
    question: '如何构建一个模型来预测Pinterest上哪些Pin会成为热门内容？请描述特征选择和模型架构。',
    recommendedAnswer: '热门Pin预测模型：1. 问题定义：热门定义：基于保存数、点击数、分享数的综合指标；预测时间窗口：发布后24小时、7天的表现；成功阈值：定义热门Pin的量化标准2. 特征工程：内容特征：图片质量、颜色分布、构图特征；文本特征：标题、描述的情感分析、关键词提取；元数据：类别、标签、发布时间；创作者特征：粉丝数、历史Pin表现、账户活跃度3. 图像分析：视觉特征：使用CNN提取图像特征；美学评分：图像美学质量评估；相似性分析：与热门Pin的视觉相似度；OCR文本：图片中的文字信息提取4. 社交信号：早期互动：发布初期的点击、保存率；传播路径：Pin的分享和传播网络；用户质量：互动用户的影响力和活跃度5. 时序特征：发布时机：发布时间对热门度的影响；趋势话题：当前热门话题的相关性；季节性：节日、季节对不同类别Pin的影响6. 模型架构：多模态融合：结合图像、文本、数值特征；深度学习：CNN处理图像，RNN处理文本序列；集成学习：结合多个模型的预测结果；在线学习：实时更新模型参数7. 评估和应用：评估指标：准确率、召回率、Top-K准确率；业务价值：提升热门内容的曝光效率；实时预测：为内容推荐系统提供信号',
    tags: '',
    source: 'LeetCode Discuss',
    year: 2024,
    isVerified: true
  },
  {
    company: '字节跳动',
    position: '数据分析师',
    questionType: 'case_study',
    difficulty: 'medium',
    question: '如果抖音的日活跃用户数突然下降了5%，你会如何分析这个问题？',
    recommendedAnswer: '日活下降分析框架：1. 问题确认：数据验证：确认DAU计算方法的一致性；时间定位：确定下降开始的具体时间；影响范围：是全球性、国内或特定地区的问题2. 维度分析：用户维度：新用户vs老用户、不同年龄段用户；地理维度：一二线城市vs三四线城市；设备维度：Android vs iOS、不同品牌手机；内容维度：不同类型内容的消费变化3. 产品分析：版本更新：是否有新版本发布导致的问题；功能变化：推荐算法、界面改版的影响；性能问题：应用崩溃率、加载速度；审核策略：内容审核政策的调整4. 外部因素：竞争环境：竞品的新功能或营销活动；监管政策：相关政策法规的变化；社会事件：重大事件对用户行为的影响；季节因素：学生开学、节假日等影响5. 技术问题：服务器问题：服务稳定性、网络连接；推送系统：消息推送的到达率；数据统计：统计系统本身的问题6. 用户行为：使用时长：虽然DAU下降，使用时长是否也下降；留存率：新用户留存和老用户回访的变化；流失分析：哪些用户群体流失最严重7. 应对策略：紧急修复：针对技术问题的快速响应；内容优化：调整推荐策略，提升内容质量；用户召回：针对流失用户的召回活动；长期策略：产品功能和用户体验的持续优化',
    tags: '',
    source: 'Blind',
    year: 2024,
    isVerified: true
  },
  {
    company: '阿里巴巴',
    position: '数据工程师',
    questionType: 'technical',
    difficulty: 'hard',
    question: '如何为淘宝设计一个大数据平台来支持实时推荐和批量分析？请描述技术架构和数据流。',
    recommendedAnswer: '淘宝大数据平台设计：1. 数据接入层：用户行为：点击、浏览、购买、收藏等实时行为数据；商品数据：商品信息、库存、价格变化；交易数据：订单、支付、物流状态；外部数据：天气、节假日、热点事件；消息队列：Apache RocketMQ处理高并发消息2. 数据存储层：实时存储：HBase存储用户画像、商品特征；流式存储：Apache Kafka存储实时事件流；批量存储：HDFS存储历史数据；缓存层：Redis/Tair支持毫秒级查询3. 计算层：流计算：Apache Flink实时特征计算和推荐；批计算：Apache Spark离线模型训练；图计算：GraphX处理用户关系和商品关联；机器学习：PAI平台支持大规模模型训练4. 服务层：推荐服务：实时个性化推荐API；特征服务：实时特征查询和计算；模型服务：在线模型预测和A/B测试；数据服务：统一数据查询和分析接口5. 运维监控：数据质量：实时数据质量监控和修复；系统监控：集群资源、任务状态监控；性能调优：根据负载自动扩缩容；故障恢复：多机房容灾和快速恢复6. 数据治理：元数据管理：数据血缘、质量、安全；权限控制：细粒度的数据访问权限；合规性：用户隐私保护、数据合规',
    tags: '',
    source: 'LeetCode Discuss',
    year: 2024,
    isVerified: true
  }
];

async function seedOriginal41Questions() {
  try {
    console.log('🌱 开始导入原始41道面试题目...');
    
    // 清空现有数据
    await sql`DELETE FROM interview_questions`;
    console.log('🗑️ 已清空现有题目');
    
    // 批量插入数据
    let insertedCount = 0;
    for (const question of originalInterviewQuestions) {
      try {
        await sql`
          INSERT INTO interview_questions (
            company, position, question_type, difficulty, question, 
            recommended_answer, tags, source, year, is_verified, created_at, updated_at
          ) VALUES (
            ${question.company}, ${question.position}, ${question.questionType}, 
            ${question.difficulty}, ${question.question}, ${question.recommendedAnswer}, 
            ${question.tags}, ${question.source}, ${question.year}, ${question.isVerified},
            NOW(), NOW()
          )
        `;
        insertedCount++;
        console.log(`✅ 插入题目 ${insertedCount}: ${question.company} - ${question.position}`);
      } catch (error) {
        console.error(`❌ 插入题目失败:`, question.company, question.question.substring(0, 50));
        console.error(error);
      }
    }
    
    console.log(`\n🎉 成功导入 ${insertedCount} 道面试题目！`);
    
    // 验证结果和统计
    const finalCount = await sql`SELECT COUNT(*) as count FROM interview_questions`;
    console.log(`📈 数据库中现有 ${finalCount[0].count} 道题目`);
    
    // 显示详细统计
    const companyStats = await sql`
      SELECT company, COUNT(*) as count 
      FROM interview_questions 
      GROUP BY company 
      ORDER BY count DESC
    `;
    
    console.log('\n🏢 公司分布:');
    companyStats.forEach((stat: any) => {
      console.log(`   ${stat.company}: ${stat.count} 道题目`);
    });
    
    const sourceStats = await sql`
      SELECT source, COUNT(*) as count 
      FROM interview_questions 
      GROUP BY source 
      ORDER BY count DESC
    `;
    
    console.log('\n📚 来源分布:');
    sourceStats.forEach((stat: any) => {
      console.log(`   ${stat.source || '无来源'}: ${stat.count} 道题目`);
    });
    
    const typeStats = await sql`
      SELECT question_type, COUNT(*) as count 
      FROM interview_questions 
      GROUP BY question_type 
      ORDER BY count DESC
    `;
    
    console.log('\n📝 题目类型分布:');
    typeStats.forEach((stat: any) => {
      console.log(`   ${stat.question_type}: ${stat.count} 道题目`);
    });
    
  } catch (error) {
    console.error('❌ 导入失败:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  seedOriginal41Questions();
}

export { seedOriginal41Questions, originalInterviewQuestions }; 