# 타로밀크티 (TarotMilkTea) 디스코드 봇

타로밀크티는 디스코드 서버에서 타로 카드 리딩을 제공하는 봇입니다. 사용자의 질문에 대해 타로 카드를 뽑아 해석을 제공하며, AI를 활용하여 개인화된 답변을 생성합니다.

## 주요 기능

- 3장 스프레드 또는 단일 카드 타로 리딩
- 타로 카드 이미지 표시
- AI 기반의 타로 해석
- 추가 질문 기능
- 사용자별, 서버별 대화 컨텍스트 유지

## 봇 초대하기

타로밀크티 봇을 여러분의 디스코드 서버에 초대하려면 다음 단계를 따르세요:

1. 아래의 초대 링크를 클릭하세요:
   [타로밀크티 봇 초대하기](https://discord.com/oauth2/authorize?client_id=1269114640940666953&permissions=8&integration_type=0&scope=bot)

2. 디스코드에 로그인되어 있지 않다면 로그인합니다.

3. 봇을 추가할 서버를 선택합니다.

4. 필요한 권한을 검토하고 '승인'을 클릭합니다.

5. 캡챠를 완료하면 봇이 서버에 추가됩니다.

## 사용 방법

1. 봇이 서버에 초대된 후, 채팅창에 다음과 같은 명령어를 입력하여 타로 리딩을 시작합니다:
   - `?타로`
   - `?운세`
   - `?점`
   - `?카드`
   - `?fortune`
   - `?tarot`
   - `?타로 점 봐줘`
   - `?오늘 운세 봐줘`
   - 그 외에도 "타로", "운세", "점" 등의 키워드가 포함된 질문

2. "3장 스프레드" 또는 "단일 카드" 버튼을 선택합니다.
3. 모달 창에 질문을 입력합니다.
4. 봇이 카드를 뽑고 해석을 제공합니다.
5. "추가 질문하기" 버튼을 눌러 더 자세한 해석을 요청할 수 있습니다.
6. "상담 종료하기" 버튼을 눌러 세션을 종료합니다.

예시 질문:
- "?오늘 나의 운세는 어떨까?"
- "?타로로 내 연애운 봐줘"
- "?직장에서의 나의 상황을 타로로 해석해줘"

## 프로젝트 구조

```
프로젝트 루트/
│
├── functions/
│   ├── tarot_images/       # 타로 카드 이미지 폴더
│   ├── .gitignore
│   ├── index.js            # 메인 애플리케이션 파일
│   ├── package-lock.json
│   └── package.json        # 프로젝트 의존성 정보
│
├── .gitignore
├── firebase.json
├── LICENSE
├── README.md
└── requirements.txt
```

## 주요 알고리즘 및 기능

1. **카드 선택**: `getRandomCards` 함수를 사용하여 중복 없이 랜덤하게 카드를 선택합니다.

2. **대화 컨텍스트 관리**: `userContexts` 맵을 사용하여 사용자별, 서버별로 대화 기록을 유지합니다.

3. **AI 통합**: Google의 Generative AI를 사용하여 타로 해석 및 대화를 생성합니다.

4. **이미지 처리**: 선택된 카드에 해당하는 이미지를 `tarot_images` 폴더에서 불러와 표시합니다.

5. **인터랙션 처리**: 버튼 클릭, 모달 제출 등 다양한 사용자 인터랙션을 처리합니다.

## 개발 환경 설정

1. 저장소를 클론합니다:
   ```
   git clone https://github.com/chococobyeol/TarotMilkTea_Bot.git
   cd TarotMilkTea_Bot
   ```

2. `functions` 디렉토리로 이동하여 의존성을 설치합니다:
   ```
   cd functions
   npm install
   ```

3. 필요한 환경 변수를 설정합니다.

4. 로컬에서 봇을 실행합니다:
   ```
   npm start
   ```

## 기여하기

이슈를 제출하거나 풀 리퀘스트를 보내주시면 감사하겠습니다. 모든 기여는 환영합니다!

## 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.