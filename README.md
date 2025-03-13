# Liveuta Native Backend

## 개발

### 필요한 것들

[bun](https://bun.sh)

```sh
curl -fsSL https://bun.sh/install | bash     # Linux, macOS
powershell -c "irm bun.sh/install.ps1 | iex" # Windows
```

### 프로젝트 받기

```sh
git clone https://github.com/pekochan069/liveuta-native-backend
cd ./liveuta-native-backend
bun i
```

### 개발 서버

```sh
bun run dev
```

## Secrets

`.env`를 `.dev.vars`로 이름 변경
