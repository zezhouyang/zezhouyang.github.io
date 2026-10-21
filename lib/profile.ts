// Selected publications: https://scholar.google.com/citations?user=z5UpJ0IAAAAJ
// Journal dates use earlier online-publication records, rather than issue dates.
// TOSEM online months currently follow OpenAlex; publisher history is not yet verified.
// Do not equate Crossref published-online or DOI creation with confirmed first online.
// Conference papers use the proceedings publication date.
// Include only CCF A/B/C venues; preprints and unranked venues are omitted.
export const publications = [
  {
    title:
      'Cascaded Code Editing: Large-Small Model Collaboration for Effective and Efficient Code Editing',
    year: 2026,
    authors:
      'Chaozheng Wang, Zezhou Yang, Shuzheng Gao, Cuiyun Gao, Zongjie Li, Yichen Li, Ting Peng, Hailiang Huang, Yuetang Deng, Michael R. Lyu',
    venue: 'FSE',
    publicationType: 'Conference',
    rank: 'A',
    url: 'https://doi.org/10.1145/3808101',
    publishedDate: '2026-06-30',
  },
  {
    title:
      'An Empirical Study of Knowledge Distillation for Code Understanding Tasks',
    year: 2026,
    authors: 'Ruiqi Wang*, Zezhou Yang*, Cuiyun Gao, Xin Xia, Qing Liao',
    venue: 'ICSE',
    publicationType: 'Conference',
    rank: 'A',
    url: 'https://doi.org/10.1145/3744916.3764547',
    publishedDate: '2026-04-12',
  },
  {
    title: 'A Roadmap for Modern Code Review: Challenges and Opportunities',
    year: 2026,
    authors:
      'Zezhou Yang, Cuiyun Gao, Zhaoqiang Guo, Zhenhao Li, Kui Liu, Xin Xia, Yuming Zhou',
    venue: 'TOSEM',
    publicationType: 'Journal',
    rank: 'A',
    url: 'https://doi.org/10.1145/3800963',
    publishedDate: '2026-03',
    onlinePublishedDate: '2026-03',
    issuePublishedDate: '2026-09-30',
    onlineDateSource: 'https://openalex.org/W7135192568',
    onlineDateNote:
      'Month based on OpenAlex’s earlier publication record; publisher first-online history remains unverified. Crossref’s current published-online field reflects a later publication stage.',
  },
  {
    title:
      'Automated Prompt Generation for Code Intelligence: An Empirical study and Experience in WeChat',
    year: 2025,
    authors:
      'Kexing Ji, Shiyun Fu, Cuiyun Gao, Yujia Chen, Zezhou Yang, Chaozheng Wang, Yuetang Deng',
    venue: 'ASE',
    publicationType: 'Conference',
    rank: 'A',
    url: 'https://doi.org/10.1109/ase63991.2025.00285',
    publishedDate: '2025-11-16',
  },
  {
    title:
      'A Deep Dive into Retrieval-Augmented Generation for Code Completion: Experience on WeChat',
    year: 2025,
    authors:
      'Zezhou Yang, Ting Peng, Cuiyun Gao, Chaozheng Wang, Hailiang Huang, Yuetang Deng',
    venue: 'ICSME',
    publicationType: 'Conference',
    rank: 'B',
    url: 'https://doi.org/10.1109/icsme64153.2025.00062',
    publishedDate: '2025-09-07',
  },
  {
    title:
      'RAG or Fine-tuning? A Comparative Study on LCMs-based Code Completion in Industry',
    year: 2025,
    authors:
      'Chaozheng Wang, Zezhou Yang, Shuzheng Gao, Cuiyun Gao, Ting Peng, Hailiang Huang, Yuetang Deng, Michael Lyu',
    venue: 'FSE',
    publicationType: 'Conference',
    rank: 'A',
    url: 'https://doi.org/10.1145/3696630.3728535',
    publishedDate: '2025-06-23',
  },
  {
    title:
      'An Empirical Study of Retrieval-Augmented Code Generation: Challenges and Opportunities',
    year: 2025,
    authors:
      'Zezhou Yang, Sirong Chen, Cuiyun Gao, Zhenhao Li, Xing Hu, Kui Liu, Xin Xia',
    venue: 'TOSEM',
    publicationType: 'Journal',
    rank: 'A',
    url: 'https://doi.org/10.1145/3717061',
    publishedDate: '2025-02',
    onlinePublishedDate: '2025-02',
    issuePublishedDate: '2025-09-30',
    onlineDateSource: 'https://openalex.org/W4407580437',
    onlineDateNote:
      'Month based on OpenAlex’s earlier publication record; publisher first-online history remains unverified. Crossref’s current published-online field reflects a later publication stage.',
  },
  {
    title:
      'Bridge and Hint: Extending Pre-trained Language Models for Long-Range Code',
    year: 2024,
    authors: 'Yujia Chen, Cuiyun Gao, Zezhou Yang, Hongyu Zhang, Qing Liao',
    venue: 'ISSTA',
    publicationType: 'Conference',
    rank: 'A',
    url: 'https://doi.org/10.1145/3650212.3652127',
    publishedDate: '2024-09-11',
  },
  {
    title: 'Parameter Description Generation with the Code Parameter Flow',
    year: 2022,
    authors: 'Qiuyuan Chen, Zezhou Yang, Zhongxin Liu, Shanping Li, Cuiyun Gao',
    venue: 'QRS',
    publicationType: 'Conference',
    rank: 'C',
    url: 'https://doi.org/10.1109/qrs57517.2022.00093',
    publishedDate: '2022-12',
  },
];

export function getPublicationDate(paper: {
  publishedDate: string;
  onlinePublishedDate?: string;
}) {
  return paper.onlinePublishedDate ?? paper.publishedDate;
}
