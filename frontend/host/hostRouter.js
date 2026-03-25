const ROUTES = [
  {
    test: (pathname) => pathname === '/',
    toFrameSrc: () => '/pages/home.html',
    showBackground: true,
    showNav: false,
  },
  {
    test: (pathname) => pathname === '/login',
    toFrameSrc: () => '/pages/login.html',
    showBackground: true,
    showNav: false,
  },
  {
    test: (pathname) => pathname === '/rooms',
    toFrameSrc: () => '/pages/rooms.html',
    showBackground: true,
    showNav: true,
  },
  {
    test: (pathname) => pathname === '/profile',
    toFrameSrc: () => '/pages/profile.html',
    showBackground: true,
    showNav: true,
  },
  {
    test: (pathname) => pathname.startsWith('/room/'),
    toFrameSrc: (pathname) => {
      const roomId = pathname.split('/')[2] || '';
      const query = roomId ? `?roomId=${encodeURIComponent(roomId)}` : '';
      return `/pages/room.html${query}`;
    },
    showBackground: false,
    showNav: false,
  },
];

const FALLBACK_ROUTE = {
  toFrameSrc: () => '/pages/home.html',
  showBackground: true,
  showNav: false,
};

export function resolveRoute(pathname) {
  const match = ROUTES.find((route) => route.test(pathname));
  const route = match || FALLBACK_ROUTE;

  return {
    frameSrc: route.toFrameSrc(pathname),
    showBackground: route.showBackground,
    showNav: route.showNav,
  };
}
