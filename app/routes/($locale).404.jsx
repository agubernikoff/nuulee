import NavLink from '~/components/NavLink';

export default function fourohfour() {
  return (
    <div className="route-error">
      <h2>404</h2>
      <div>
        <p>we're sorry, the page you're looking for doesn't exist</p>
        <NavLink style={{textDecoration: 'underline'}} to="/" prefetch="intent">
          return home
        </NavLink>
      </div>
    </div>
  );
}
