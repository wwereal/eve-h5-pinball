import Cookie from 'js-cookie';

export function getUserId() {
    const userId = Cookie.get('ud') ?? Cookie.get('userId');
    return userId;
}
