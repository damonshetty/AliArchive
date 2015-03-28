using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Data.Entity;

namespace AliArchive.Repository.EntityFramework
{
    public class AliRepository : IRepository
    {
        public readonly AliDBContext _context;
        
        public AliRepository()
        {
            _context = new AliDBContext();
        }
        
        public IQueryable<T> All<T>() where T : class
        {
            return _context.Set<T>();
        }
        
        public IQueryable<T> AllIncludingFights<T>(params Expression<Func<T, object>>[] include) where T : class
        {
            IQueryable<T> retVal = _context.Set<T>();
            
            foreach(var item in include)
            {
                retVal = retVal.Include(item);
            }
            
            return retVal;
        }

        public IQueryable<T> AllFights<T>(params Expression<Func<T, object>>[] include) where T : class
        {
            return _context.Set<T>();
        }

        public void Dispose()
        {
            if(_context != null) _context.Dispose();
        }        
    }
}
